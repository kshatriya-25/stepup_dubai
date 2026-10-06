/**
 * POST /api/payment/coupon — is this code any good, and what does it take off?
 *
 * Exists because the catalogue is server-side (see the top of @/lib/coupons): the browser
 * cannot check a code itself without the codes being in the bundle, so it asks. The answer
 * is the one the checkout displays AND the one /api/payment/order will reach on its own
 * when the money moves — same function, same catalogue, so the page cannot promise a
 * discount the order endpoint then declines to give.
 *
 * THIS ENDPOINT MOVES NO MONEY AND RESERVES NOTHING. It is a read. A code with ten
 * redemptions left can be checked a thousand times; it is spent only by a captured
 * payment, which is what couponUses() counts. So a visitor who checks a code and
 * abandons the form has cost the next visitor nothing.
 *
 * IT IS THE ONE PLACE A CODE CAN BE GUESSED, so it is rate limited on its own budget —
 * see ATTEMPTS below.
 */

import { NextResponse } from 'next/server'
import { clean, clientIp } from '@/lib/submission'
import { pricedTicketById } from '@/lib/pricing'
import { MAX_EXTRA_MEMBERS } from '@/content/tickets'
import { formatPaise } from '@/lib/order-total'
import { checkCoupon, normaliseCode } from '@/lib/coupons'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/*
 * A SEPARATE RATE LIMIT FROM THE FORMS, deliberately.
 *
 * @/lib/submission's limiter exists to cap OUTBOUND MAIL per visitor, and its budget is
 * shared between /api/register and /api/partner. Spending that budget on coupon attempts
 * would mean somebody who mistyped a code six times could no longer register at all —
 * trading a real registration for a guess nobody made.
 *
 * The budget here is what a genuine customer needs (a few tries, a paste that went wrong,
 * a second pass) and far less than a dictionary attack needs. The codes are also capped by
 * redemption in the catalogue, so even a guessed code is bounded.
 */
const WINDOW_MS = 10 * 60 * 1000
const ATTEMPTS = 20
const hits = new Map<string, number[]>()

function tooManyAttempts(ip: string): boolean {
  const now = Date.now()
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS)
  recent.push(now)
  hits.set(ip, recent)
  if (hits.size > 5000) hits.clear() // crude bound; this map must never grow forever
  return recent.length > ATTEMPTS
}

export async function POST(req: Request) {
  let raw: Record<string, unknown>
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body.' }, { status: 400 })
  }

  const ticket = pricedTicketById(clean(raw.ticketId, 40))
  if (!ticket) return NextResponse.json({ ok: false, error: 'Unknown pass type.' }, { status: 400 })

  const code = normaliseCode(raw.code)
  if (!code) return NextResponse.json({ ok: false, error: 'Enter a coupon code.' }, { status: 400 })

  if (tooManyAttempts(clientIp(req))) {
    return NextResponse.json(
      { ok: false, error: 'Too many coupon attempts. Try again in a few minutes.' },
      { status: 429 },
    )
  }

  // Same floor and cap the order endpoint applies, so the discount is quoted against the
  // amount that will actually be charged rather than an unbounded claimed team size.
  const claimed = Number.parseInt(clean(raw.extraMembers, 4) || '0', 10)
  const extraMembers = Number.isFinite(claimed) ? Math.min(Math.max(claimed, 0), MAX_EXTRA_MEMBERS) : 0

  const result = checkCoupon({
    code,
    ticket,
    extraMembers,
    // Optional at this stage — the form may not have an address yet. A once-per-email code
    // is judged again, with the address, where it is spent.
    email: clean(raw.email, 160).toLowerCase() || undefined,
  })

  if (!result.ok) {
    // 200, not 4xx: an expired code is a valid question with a negative answer, and the
    // checkout shows `error` either way. Reserving the status codes for malformed requests
    // keeps "this code is no good" out of the server's error logs.
    return NextResponse.json({ ok: false, error: result.error })
  }

  return NextResponse.json({
    ok: true,
    code: result.applied.code,
    label: result.applied.label,
    discountPaise: result.applied.discountPaise,
    discountLabel: formatPaise(result.applied.discountPaise),
    // The checkout rebuilds the breakdown locally from the three fields above — same
    // orderTotal(), same inputs. These two are here so a mismatch is visible in a network
    // trace rather than only on the page.
    totalPaise: result.total.totalPaise,
    totalLabel: formatPaise(result.total.totalPaise),
  })
}
