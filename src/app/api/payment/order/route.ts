/**
 * POST /api/payment/order — buy a ticket.
 *
 * Validates the form, writes the intent to the journal, and creates a Razorpay order.
 * Returns only what Checkout needs. It does NOT record a registration: nothing is
 * recorded until money is confirmed captured, by /verify or /webhook.
 *
 * THE AMOUNT IS NEVER TAKEN FROM THE REQUEST. The browser sends a ticket `id`; the
 * price is looked up here from @/content/tickets. A client that POSTs
 * `{"ticketId":"founder","priceInr":1}` gets charged ₹3,999 like everyone else, and an
 * unknown id is rejected outright rather than defaulted to something cheap.
 *
 * ORDERING MATTERS HERE. The journal row is written BEFORE the order is created, so a
 * crash in the gap leaves a harmless orphan record rather than a paid order nobody
 * knows about. Losing an unpaid intent costs nothing; losing a paid one costs a
 * customer their seat.
 */

import { NextResponse } from 'next/server'
import { createHash } from 'node:crypto'
import { rateLimited, clientIp } from '@/lib/submission'
import { parseSubmission } from '@/lib/registration-input'
import { paymentConfig, createOrder, formatInr, isLiveMode } from '@/lib/payments/razorpay'
import { ticketPaise, tickets, formatTicketPrice, isFreePass } from '@/content/tickets'
import {
  createRecord,
  getRecord,
  findReusableByIdempotencyKey,
  journalHealth,
  ensureWritable,
  type Registration,
} from '@/lib/payments/journal'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const cfg = paymentConfig()
  if (!cfg.ok) {
    // Half-configured deploy. Refuse loudly rather than quietly falling back to free
    // registration — see the comment on paymentEnabled in @/lib/payments/razorpay.
    console.error('[payments]', cfg.error)
    return NextResponse.json(
      { ok: false, error: 'Payments are temporarily unavailable. Please try again shortly.' },
      { status: 503 },
    )
  }
  if (!cfg.enabled) {
    return NextResponse.json({ ok: false, error: 'Payment is not enabled.' }, { status: 404 })
  }

  /*
   * Refuse to take money we cannot record.
   *
   * If the journal is unwritable (wrong permissions on PAYMENT_JOURNAL_PATH, full
   * disk), fulfilment would still work for the life of this process but nothing would
   * survive a restart — so a crash at the wrong moment loses a paid registration with
   * no local trace. Declining to start NEW payments is the safe side of that trade;
   * money already captured is still settled normally by /verify and /webhook.
   */
  // Probe rather than trust the cached flag, so the very first request after a
  // permissions break is caught too — before an order exists.
  ensureWritable()
  const journal = journalHealth()
  if (!journal.healthy) {
    console.error(`[payments] refusing new orders — journal unwritable at ${journal.path}`)
    return NextResponse.json(
      { ok: false, error: 'Payments are temporarily unavailable. Please try again shortly.' },
      { status: 503 },
    )
  }

  let raw: Record<string, unknown>
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body.' }, { status: 400 })
  }

  /*
   * Resolve and validate BEFORE anything else touches money.
   *
   * Same parser as /api/register, so this endpoint cannot accept a submission the
   * waitlist would reject or vice versa — see @/lib/registration-input. It resolves the
   * pass from the catalogue by id, so an unrecognised id is refused rather than
   * defaulting to something cheap, and it caps the chargeable extra-member count.
   */
  const parsed = parseSubmission(raw)
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 })
  }
  const { ticket, reg, extraMembers } = parsed

  /*
   * The Free Pass has no price, so there is no order to create.
   *
   * Refuse rather than create a zero-amount order: Razorpay rejects those anyway, and a
   * zero-rupee "payment" in the journal would be a paid registration that nobody paid
   * for. The client never routes a free pass here — this is the guard for a direct POST.
   */
  if (isFreePass(ticket)) {
    return NextResponse.json(
      { ok: false, error: 'This pass is free — no payment is needed. Register instead.' },
      { status: 400 },
    )
  }

  // Priced from the catalogue plus the validated extras count. The browser sent a pass
  // id and a number of people; it never sent an amount.
  const amountPaise = ticketPaise(ticket, extraMembers)

  if (rateLimited(clientIp(req))) {
    return NextResponse.json(
      { ok: false, error: 'Too many attempts from this network. Try again later.' },
      { status: 429 },
    )
  }

  /*
   * Idempotency across double-clicks and client retries — enforced HERE, not by
   * Razorpay.
   *
   * Razorpay's `x-razorpay-idempotency` header only applies to RazorpayX Payouts; the
   * Orders API ignores it. Confirmed empirically — two identical POSTs came back as
   * two distinct orders. So the journal is the dedup authority: if this exact payer,
   * amount and 5-minute bucket already has an UNPAID order, hand that one back.
   *
   * The bucket keeps it from being too sticky. A genuine second purchase later gets a
   * fresh order rather than being pinned to a stale one, and findReusableByIdempotencyKey
   * refuses to reuse anything already paid.
   */
  // The ticket id is part of the key: buying a Delegate Pass and then a Founder
  // Programme within the same five minutes are two genuine purchases, not a double
  // click, and must not collapse into one order.
  const bucket = Math.floor(Date.now() / (5 * 60 * 1000))
  const idempotencyKey = createHash('sha256')
    .update(`${reg.email}|${reg.phone}|${ticket.id}|${amountPaise}|${bucket}`)
    .digest('hex')
    .slice(0, 32)

  const reusable = findReusableByIdempotencyKey(idempotencyKey)
  if (reusable) {
    return NextResponse.json({
      ok: true,
      keyId: cfg.keyId,
      orderId: reusable.orderId,
      amount: reusable.amountPaise,
      amountLabel: formatInr(reusable.amountPaise),
      currency: 'INR',
      ticketName: ticket.name,
      reused: true,
      testMode: !isLiveMode(),
      prefill: { name: reg.name, email: reg.email, contact: reg.phone.replace(/\s/g, '') },
    })
  }

  // Razorpay caps receipts at 40 chars. Derived from the same key, so a retried order
  // keeps its receipt too.
  const receipt = `t2r_${idempotencyKey.slice(0, 24)}`

  const order = await createOrder({
    amountPaise,
    receipt,
    // Carries the full registration into Razorpay's own storage — the backstop that
    // makes every paid registration recoverable even if this server's disk is lost.
    // The ticket is included so a recovered order can be fulfilled with the right pass.
    /*
     * Carries the registration into Razorpay's own storage — the backstop that makes
     * every paid registration recoverable even if this server's disk is lost.
     *
     * Razorpay caps notes at 15 keys, so this is the recoverable MINIMUM rather than
     * everything the form collected: enough to contact the payer, know what they bought,
     * and rebuild a sheet row. The pitch narrative lives in the journal and the sheet,
     * and losing it would cost a follow-up email, not a seat.
     */
    notes: {
      name: reg.name,
      email: reg.email,
      phone: reg.phone,
      city: reg.city,
      category: reg.category || '',
      registerAs: reg.registerAs,
      orgName: reg.orgName || '',
      idNumber: reg.idNumber || '',
      startupName: reg.startupName || '',
      workshop: reg.workshop || '',
      extraMembers: reg.extraMembers || '0',
      updates: reg.updates,
      ticketId: reg.ticketId,
      ticketName: reg.ticketName,
      source: 'tier2rising.com/#tickets',
    },
    idempotencyKey,
  })

  if (!order.ok) {
    console.error('[payments] order creation failed:', order.error)
    return NextResponse.json(
      { ok: false, error: 'We could not start the payment. Please try again.' },
      { status: 502 },
    )
  }

  // Only journal an order we have not seen — a repeated idempotency key returns the
  // same order id, and overwriting would reset a record that may already be paid.
  if (!getRecord(order.data.id)) {
    createRecord({
      orderId: order.data.id,
      receipt: order.data.receipt || receipt,
      amountPaise: order.data.amount,
      registration: reg,
      idempotencyKey,
    })
  }

  return NextResponse.json({
    ok: true,
    keyId: cfg.keyId,
    orderId: order.data.id,
    amount: order.data.amount,
    amountLabel: formatInr(order.data.amount),
    currency: order.data.currency,
    ticketName: ticket.name,
    testMode: !isLiveMode(),
    prefill: { name: reg.name, email: reg.email, contact: reg.phone.replace(/\s/g, '') },
  })
}

/** Health check — what is actually wired, without leaking the secret. */
export async function GET() {
  const cfg = paymentConfig()
  ensureWritable()
  const journal = journalHealth()
  return NextResponse.json({
    ok: cfg.ok && journal.healthy,
    service: 'tier2-rising-payments',
    enabled: cfg.ok && cfg.enabled,
    mode: isLiveMode() ? 'LIVE' : 'test',
    tickets: tickets.map((t) => ({ id: t.id, name: t.name, price: formatTicketPrice(t) })),
    journal: { writable: journal.healthy, path: journal.path, error: journal.error },
    error: cfg.ok ? undefined : cfg.error,
  })
}
