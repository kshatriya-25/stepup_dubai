/**
 * Settlement and fulfilment — the only place a payment is allowed to become a
 * registration.
 *
 * Three callers, one code path, deliberately:
 *   - /api/payment/verify    the browser, immediately after Checkout succeeds
 *   - /api/payment/webhook   Razorpay, independent of the browser
 *   - /api/payment/reconcile the sweep, for anything the first two missed
 *
 * They race by design. Whichever arrives first does the work; the others observe that
 * it is done and return the same answer. Duplicated effort is fine; duplicated EFFECT
 * is not, which is what withOrderLock() plus the status check give us.
 *
 * THE INVARIANT
 *   No payment ends in a state that is both captured and silent.
 *   Either the registration is recorded, or a human has been emailed about it.
 *
 * There is no auto-refund path here on purpose. Refunding is a judgement call with
 * accounting consequences, and the registration payload is safe in two places
 * (journal + Razorpay order notes), so nothing is ever lost by waiting for a person.
 */

import 'server-only'
import { appendToSheet } from '@/lib/submission'
import { sendMail, organiserRecipients } from '@/lib/email/mailer'
import {
  paidParticipantEmail,
  paidOrganiserEmail,
  unfulfilledAlertEmail,
  type PaymentInfo,
  type Registration as EmailRegistration,
} from '@/lib/email/templates'
import {
  fetchPayment,
  fetchOrder,
  capturePayment,
  formatInr,
  isLiveMode,
  type RazorpayPayment,
} from './razorpay'
import {
  getRecord,
  updateRecord,
  adoptRecord,
  withOrderLock,
  type PaymentRecord,
  type Registration,
} from './journal'

/** Sheet write attempts, with the per-attempt timeout that goes with each. */
const SHEET_ATTEMPTS = [8_000, 8_000, 12_000]
const BACKOFF_MS = [400, 1_200]

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Journal registration → email registration (the email templates have no `updates`). */
function forEmail(r: Registration): EmailRegistration {
  return {
    name: r.name,
    email: r.email,
    phone: r.phone,
    sector: r.sector,
    registerAs: r.registerAs,
    city: r.city,
  }
}

function paymentInfo(rec: PaymentRecord, paidAt: Date): PaymentInfo {
  return {
    paymentId: rec.paymentId || '—',
    orderId: rec.orderId,
    amountPaise: rec.amountPaise,
    amountLabel: formatInr(rec.amountPaise),
    ticketName: rec.registration.ticketName || 'Ticket',
    paidAt,
    method: rec.method,
    testMode: !isLiveMode(),
  }
}

/** Reconstruct a registration from a Razorpay order's notes. The disaster-recovery path. */
function registrationFromNotes(notes: Record<string, string>): Registration | null {
  const r: Registration = {
    name: notes.name || '',
    email: notes.email || '',
    phone: notes.phone || '',
    sector: notes.sector || '',
    registerAs: notes.registerAs || '',
    city: notes.city || '',
    updates: notes.updates || 'no',
    ticketId: notes.ticketId || '',
    // Falls back to a readable placeholder rather than an empty cell: a receipt saying
    // "Ticket —" is confusing, but a blank column in the sheet is worse to audit.
    ticketName: notes.ticketName || notes.ticketId || 'Ticket',
  }
  // Name and email are the minimum needed to contact the customer and record a row.
  return r.name && r.email ? r : null
}

export type SettleResult =
  /** Money captured and registration recorded. */
  | { status: 'fulfilled'; record: PaymentRecord; alreadyDone: boolean }
  /** Money captured, recording failed, a human has been alerted. The CUSTOMER IS FINE. */
  | { status: 'fulfil_failed'; record: PaymentRecord; error: string }
  /** Razorpay says this payment did not succeed. No money moved. */
  | { status: 'not_paid'; reason: string }
  /** We could not reach Razorpay or the state is unknown. Retry later; do NOT assume. */
  | { status: 'unknown'; reason: string }

/**
 * Settle a payment: confirm with Razorpay that the money is real, then fulfil.
 *
 * `paymentId` is optional — the reconciliation sweep may only know the order. Nothing
 * here trusts a caller's claim that the payment succeeded; the Razorpay API is asked
 * every time. A signature proves provenance, not payment.
 */
export async function settle(args: {
  orderId: string
  paymentId?: string
  /** Pre-fetched payment (the webhook already has it) — saves an API round trip. */
  payment?: RazorpayPayment
  source: 'verify' | 'webhook' | 'reconcile'
}): Promise<SettleResult> {
  const { orderId, source } = args

  return withOrderLock(orderId, async () => {
    let rec = getRecord(orderId)

    // --- Recover an order this server has no journal entry for ---------------
    // Disk loss, a restore from backup, or a payment against a previous deploy.
    // Razorpay's copy of the notes is the source of truth in that case.
    if (!rec) {
      const order = await fetchOrder(orderId)
      if (!order.ok) return { status: 'unknown', reason: `order lookup failed: ${order.error}` }
      const reg = registrationFromNotes(order.data.notes || {})
      if (!reg) {
        return {
          status: 'unknown',
          reason: `order ${orderId} has no recoverable registration in notes`,
        }
      }
      console.warn(`[payments] adopting unknown order ${orderId} from Razorpay notes (${source})`)
      rec = adoptRecord({
        orderId,
        receipt: order.data.receipt || orderId,
        amountPaise: order.data.amount,
        registration: reg,
        status: 'pending',
        paymentId: args.paymentId,
      })
    }

    // --- Already done? -------------------------------------------------------
    // The whole point of the lock. Two callers racing both land here; the loser
    // returns the winner's outcome instead of sending a second receipt.
    if (rec.status === 'fulfilled') {
      return { status: 'fulfilled', record: rec, alreadyDone: true }
    }

    /*
     * --- Retry a known-captured payment without re-asking Razorpay -----------
     *
     * 'paid' and 'fulfil_failed' are only ever set after capture was confirmed and
     * journaled, so the money is not in question — only the sheet write is. Requiring
     * a fresh API call here would mean a Razorpay outage could block us from retrying
     * work that has nothing to do with Razorpay, which is precisely backwards: these
     * are the records where a customer has already paid and is waiting.
     *
     * Skipped when the caller brought a fresh payment entity (the webhook does), since
     * that is strictly better information.
     */
    if ((rec.status === 'paid' || rec.status === 'fulfil_failed') && rec.paymentId && !args.payment) {
      return fulfil(rec, rec.paidAt ? new Date(rec.paidAt) : new Date(rec.updatedAt), source)
    }

    // --- Confirm with Razorpay ----------------------------------------------
    let payment = args.payment
    if (!payment) {
      const id = args.paymentId || rec.paymentId
      if (!id) return { status: 'unknown', reason: 'no payment id known for this order' }
      const fetched = await fetchPayment(id)
      if (!fetched.ok) return { status: 'unknown', reason: `payment lookup failed: ${fetched.error}` }
      payment = fetched.data
    }

    // The payment must belong to THIS order. Without this check, a valid payment for a
    // ₹1 order could be presented against a ₹5,000 one.
    if (payment.order_id && payment.order_id !== orderId) {
      return {
        status: 'unknown',
        reason: `payment ${payment.id} belongs to order ${payment.order_id}, not ${orderId}`,
      }
    }

    if (payment.status === 'failed') {
      updateRecord(orderId, {
        status: 'failed',
        paymentId: payment.id,
        lastError: payment.error_description || 'payment failed',
      })
      return { status: 'not_paid', reason: payment.error_description || 'payment failed' }
    }

    // An authorised-but-uncaptured payment silently reverses after a few days, so take
    // it now. Orders are created with payment_capture:1, so this is the belt to that
    // brace — it only fires on accounts set to manual capture.
    if (payment.status === 'authorized') {
      const captured = await capturePayment(payment.id, rec.amountPaise)
      if (!captured.ok) {
        return { status: 'unknown', reason: `capture failed: ${captured.error}` }
      }
      payment = captured.data
    }

    if (payment.status !== 'captured') {
      return { status: 'not_paid', reason: `payment status is "${payment.status}"` }
    }

    // Underpayment guard. Razorpay will not let a customer pay less than the order
    // amount, but this costs nothing and turns a silent revenue leak into a loud alert
    // if that ever stops being true.
    if (payment.amount < rec.amountPaise) {
      console.error(
        `[payments] UNDERPAID order=${orderId} expected=${rec.amountPaise} got=${payment.amount}`,
      )
      return {
        status: 'unknown',
        reason: `amount mismatch: expected ${rec.amountPaise} paise, captured ${payment.amount}`,
      }
    }

    // --- Money is real. From here the invariant applies. ---------------------
    const paidAt = new Date(payment.created_at * 1000)
    rec =
      updateRecord(orderId, {
        status: rec.status === 'fulfil_failed' ? 'fulfil_failed' : 'paid',
        paymentId: payment.id,
        method: payment.method || undefined,
        // Journaled so a later retry knows the money is settled even if Razorpay is
        // unreachable at that moment.
        paidAt: paidAt.toISOString(),
      }) || rec

    return fulfil(rec, paidAt, source)
  })
}

/**
 * Record the registration and send the receipt. Assumes money is confirmed captured
 * and that the caller holds the order lock.
 */
async function fulfil(
  rec: PaymentRecord,
  paidAt: Date,
  source: string,
): Promise<SettleResult> {
  const pay = paymentInfo(rec, paidAt)
  const reg = rec.registration
  const attempts = rec.fulfilAttempts + 1

  // 1. The sheet. This is the record of truth and the only step that can fail the
  //    fulfilment — a receipt with no row means a customer with no seat.
  let lastError = ''
  for (let i = 0; i < SHEET_ATTEMPTS.length; i++) {
    const res = await appendToSheet(
      'registration',
      {
        name: reg.name,
        email: reg.email,
        phone: reg.phone,
        sector: reg.sector,
        registerAs: reg.registerAs,
        city: reg.city,
        // Payment columns, appended at the END of the sheet — see the ordering rule
        // at the top of registration/Code.gs.
        paymentStatus: 'Paid',
        ticket: pay.ticketName,
        amount: pay.amountLabel,
        paymentId: pay.paymentId,
        orderId: pay.orderId,
        paidAt: paidAt.toISOString(),
      },
      SHEET_ATTEMPTS[i],
    )
    if (res.ok) {
      lastError = ''
      break
    }
    lastError = res.error
    console.error(`[payments] sheet append attempt ${i + 1} failed (${source}):`, res.error)
    if (i < BACKOFF_MS.length) await sleep(BACKOFF_MS[i])
  }

  if (lastError) {
    // Captured but unrecorded — the case this subsystem exists for. Alert a human once,
    // keep the record so reconcile retries, and let the caller tell the customer they
    // are fine (they are: we have their money and their details).
    const updated =
      updateRecord(rec.orderId, {
        status: 'fulfil_failed',
        fulfilAttempts: attempts,
        lastError,
      }) || rec

    if (!rec.alerted) {
      const alert = unfulfilledAlertEmail(forEmail(reg), pay, lastError)
      const sent = await sendMail({ to: organiserRecipients, replyTo: reg.email, ...alert })
      if (sent.ok) {
        updateRecord(rec.orderId, { alerted: true })
      } else {
        // Both the sheet AND the alert are down. Nothing left but the log and the
        // journal — which is exactly why the journal exists and why reconcile re-runs.
        console.error(
          `[payments] CRITICAL: paid but unrecorded AND alert mail failed. ` +
            `order=${rec.orderId} payment=${pay.paymentId} amount=${pay.amountLabel} ` +
            `email=${reg.email} error=${sent.error}`,
        )
      }
    }

    return { status: 'fulfil_failed', record: updated, error: lastError }
  }

  // 2. Mark fulfilled BEFORE emailing. If the process dies between the two, the worst
  //    case is a customer with a seat and no receipt — recoverable, and visible in the
  //    sheet. Emailing first and dying would give us a receipt with no seat, which is
  //    the failure we are engineering against.
  const fulfilled =
    updateRecord(rec.orderId, {
      status: 'fulfilled',
      fulfilAttempts: attempts,
      fulfilledAt: new Date().toISOString(),
      lastError: undefined,
    }) || rec

  // 3. Mail both sides. Neither can fail the fulfilment.
  const [toCustomer, toOrganiser] = await Promise.all([
    sendMail({ to: reg.email, ...paidParticipantEmail(forEmail(reg), pay) }),
    sendMail({
      to: organiserRecipients,
      replyTo: reg.email,
      ...paidOrganiserEmail(forEmail(reg), pay),
    }),
  ])

  if (!toCustomer.ok) {
    // The seat is booked, so this is not an emergency — but the customer has paid and
    // has no receipt, and will email asking. Tell the organiser so they can forward one.
    console.error('[payments] receipt mail failed:', toCustomer.error)
    const alert = unfulfilledAlertEmail(
      forEmail(reg),
      pay,
      `Registration WAS recorded successfully — only the receipt email failed: ${toCustomer.error}. ` +
        `No data is missing; please forward a confirmation to the customer.`,
    )
    await sendMail({
      to: organiserRecipients,
      subject: `Receipt email failed (seat IS booked) — ${reg.name}`,
      html: alert.html,
      text: alert.text,
    })
  }
  if (!toOrganiser.ok) console.error('[payments] organiser mail failed:', toOrganiser.error)

  return { status: 'fulfilled', record: fulfilled, alreadyDone: false }
}
