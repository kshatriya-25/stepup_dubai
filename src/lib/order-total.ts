/**
 * THE ORDER ARITHMETIC — one function, used by the checkout, the summary rail and the
 * endpoint that takes the money.
 *
 * WHY IT IS ITS OWN MODULE
 * Before coupons there was one number to agree on and three places computing it:
 * `ticket.priceInr + extras` appeared in PassCheckout, in PassSummary and in
 * /api/payment/order. They agreed because the expression was short enough to copy
 * correctly. A coupon makes it an ordered calculation — list price, early-bird credit,
 * extras, subtotal, discount, clamp — and three copies of that will not stay in step.
 * So the page the customer reads and the endpoint that charges them now build the SAME
 * breakdown from the same code, and the total is whatever the last line of it says.
 *
 * SAFE TO IMPORT FROM CLIENT CODE, like @/content/tickets and for the same reason:
 * nothing here is secret and nothing here is trusted. The browser is handed a breakdown
 * so it can show the arithmetic; it never sends an amount. The server rebuilds this from
 * the pass id, the validated extra-member count and a coupon code it has just checked
 * against its own catalogue — see @/lib/coupons, which IS server-only.
 *
 * PAISE, ALWAYS. Integer paise end to end, because `0.1 + 0.2 !== 0.3` and because
 * Razorpay's API is paise-denominated. The only rupee figures in here are the ones
 * coming out of the catalogue, and they are multiplied up immediately.
 */

import { ticketPaise, hasOffer, savingInr, isFreePass, formatInrRupees, type Ticket } from '@/content/tickets'

/**
 * A coupon that has already been validated, as the arithmetic sees it.
 *
 * `discountPaise` is what the coupon ASKS for. What it actually gets is whatever
 * orderTotal() allows after clamping — see MIN_PAYABLE_PAISE.
 */
export type AppliedDiscount = {
  code: string
  /** What the checkout prints beside the code, e.g. "20% off · Startup Singam community". */
  label: string
  discountPaise: number
}

export type Line = {
  /** React key, and the thing tests assert on. Never shown. */
  key: string
  label: string
  /** Second line under the label — "Per Person", "Limited period", the coupon code. */
  note?: string
  /** Always positive. `credit` lines are rendered with a minus sign. */
  paise: number
  kind: 'charge' | 'credit'
}

export type OrderTotal = {
  /** The pass, its early-bird credit and any paid extras. Everything before a coupon. */
  items: Line[]
  /** What the pass costs before a coupon — the figure a percentage is taken OF. */
  subtotalPaise: number
  /** The coupon line, already clamped, or null when none applies. */
  coupon: Line | null
  discountPaise: number
  totalPaise: number
  /** More than one item line, so a reader benefits from seeing it added up. */
  itemised: boolean
}

/**
 * THE FLOOR. A Razorpay order must be worth at least one rupee.
 *
 * Razorpay rejects a zero-amount order outright, and a ₹0 "payment" would be worse than
 * the rejection: it would travel the paid path — journal row, receipt, "Amount paid ₹0" —
 * for money nobody moved. A full waiver is therefore NOT a coupon. It is a free
 * registration, which is a different code path (/api/register) and a decision for a human,
 * not something a discount code should be able to reach by accident.
 *
 * So a coupon worth more than the pass is clamped to leave ₹1 payable rather than
 * refused: the visitor sees the largest discount the system can honour and can still
 * check out. @/lib/coupons keeps the catalogue well inside this, so the clamp is a
 * backstop against a typo — `value: 1000` on a percentage — not a routine path.
 */
export const MIN_PAYABLE_PAISE = 100

/** What the pass and its paid extras cost, before any coupon. */
export function subtotalPaise(ticket: Ticket, extraMembers = 0): number {
  return ticketPaise(ticket, extraMembers)
}

/**
 * The whole breakdown, in the order it is read.
 *
 * THE EARLY BIRD IS A LINE, NOT A SMALLER PRICE. `priceInr` is already the discounted
 * figure and `listPriceInr` is what it was, so the first two lines are "Workshop Pass
 * ₹999" and "Early bird −₹500" — which add up to the ₹499 the catalogue charges. Showing
 * it as one ₹499 line would be correct and would hide the saving at the exact moment the
 * customer is deciding; showing it as a credit puts the offer in the money column where
 * it is doing its job. Nothing here changes what is charged: the subtotal is
 * ticketPaise(), unchanged, and the two lines are arranged to sum to it.
 */
export function orderTotal(
  ticket: Ticket,
  extraMembers = 0,
  discount: AppliedDiscount | null = null,
): OrderTotal {
  const subtotal = subtotalPaise(ticket, extraMembers)
  const items: Line[] = []

  if (isFreePass(ticket)) {
    return { items, subtotalPaise: 0, coupon: null, discountPaise: 0, totalPaise: 0, itemised: false }
  }

  const offer = hasOffer(ticket)
  items.push({
    key: 'pass',
    label: ticket.name,
    note: ticket.unit,
    paise: (offer ? ticket.listPriceInr! : ticket.priceInr) * 100,
    kind: 'charge',
  })
  if (offer) {
    items.push({
      key: 'offer',
      label: 'Early bird',
      note: 'Limited period',
      paise: savingInr(ticket) * 100,
      kind: 'credit',
    })
  }
  if (ticket.extraMemberInr && extraMembers > 0) {
    items.push({
      key: 'extras',
      label: `${extraMembers} extra ${extraMembers === 1 ? 'person' : 'people'}`,
      note: `${formatInrRupees(ticket.extraMemberInr)} each`,
      paise: extraMembers * ticket.extraMemberInr * 100,
      kind: 'charge',
    })
  }

  // Clamped here rather than where the coupon is defined, so EVERY route to a discount —
  // the catalogue, a stale browser tab, a future admin override — lands on the same floor.
  const discountPaise = discount
    ? Math.max(0, Math.min(Math.round(discount.discountPaise), subtotal - MIN_PAYABLE_PAISE))
    : 0

  const coupon: Line | null =
    discount && discountPaise > 0
      ? { key: 'coupon', label: discount.label, note: discount.code, paise: discountPaise, kind: 'credit' }
      : null

  return {
    items,
    subtotalPaise: subtotal,
    coupon,
    discountPaise,
    totalPaise: subtotal - discountPaise,
    itemised: items.length > 1,
  }
}

/** 49900 → "₹499". Whole rupees only: every amount this file produces is a rupee multiple. */
export function formatPaise(paise: number): string {
  return formatInrRupees(Math.round(paise / 100))
}

/** "−₹150" for a credit, "₹999" for a charge. The minus is U+2212, not a hyphen. */
export function formatLine(line: Line): string {
  return `${line.kind === 'credit' ? '−' : ''}${formatPaise(line.paise)}`
}
