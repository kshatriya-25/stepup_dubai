/**
 * THE COUPON CATALOGUE AND THE RULES FOR SPENDING ONE.
 *
 * WHY THIS IS NOT IN src/content LIKE THE PASSES ARE
 * @/content/tickets is deliberately client-importable: a price is public, so the page and
 * the order endpoint share the constant and cannot drift. A COUPON CODE IS NOT PUBLIC. A
 * catalogue imported by a client component is compiled into the JavaScript the browser
 * downloads, so every private partner code — and every code not launched yet — would be
 * one "view source" away from a forum post. So the codes live server-side, and the browser
 * learns nothing except whether the code someone TYPED is good.
 *
 * NOTHING HERE DECIDES WHAT IS CHARGED ON ITS OWN. This module answers "is this code
 * valid, and what is it worth"; @/lib/order-total does the arithmetic and enforces the
 * floor; /api/payment/order does both again at the moment money moves, from the code
 * string rather than from any amount the browser sent. A tampered request therefore gets
 * the discount the catalogue says, or no discount at all — never the one it asked for.
 *
 * NOTHING IN THIS FILE MAY BE QUOTED IN CLIENT CODE — not in a placeholder, not in help
 * text, not in a comment inside a 'use client' component. A string in a client component is
 * a string in the downloaded bundle, which is the one thing keeping the codes here is meant
 * to prevent. The checkout's box therefore says "Enter code" and nothing more.
 *
 * HOW TO CHANGE THE OFFERS
 * Edit `coupons` below. One object per code, and deleting a line retires the code
 * immediately. It is a code change for the same reason prices are (see the top of
 * @/content/tickets): money belongs in review and in git history, not in a .env a copied
 * file can carry to the wrong server.
 */

import 'server-only'
import { PITCH_TICKET_ID, type TicketId, type Ticket } from '@/content/tickets'
import { orderTotal, subtotalPaise, type AppliedDiscount, type OrderTotal } from '@/lib/order-total'
import { couponUses } from '@/lib/payments/journal'

export type Coupon = {
  /** Canonical code, UPPERCASE and digits only — see normaliseCode for what is accepted. */
  code: string
  kind: 'percent' | 'flat'
  /** Percentage (1–100) or whole rupees off, depending on `kind`. */
  value: number
  /** Shown to the visitor beside the code once it applies. Keep it short and factual. */
  label: string
  /** The passes it works on. Omit for every paid pass; the Free Pass is never eligible. */
  passes?: TicketId[]
  /** Valid from / until, inclusive, as YYYY-MM-DD in IST. Omit for no bound. */
  from?: string
  until?: string
  /**
   * Hard cap on how many PAID registrations may use it. Counted from the payment journal,
   * so an abandoned checkout does not burn one — see couponUses().
   */
  maxRedemptions?: number
  /** One redemption per email address. For a code given to a named person or cohort. */
  oncePerEmail?: boolean
  /** Who it is for, for whoever reads this file next. Never shown to the visitor. */
  note?: string
}

/*
 * THE LIVE CODES.
 *
 * Every one carries an expiry and a redemption cap on purpose. A code is a password that
 * gets forwarded — the cap is what keeps a leaked one from being an open sale, and the
 * expiry is what keeps a retired campaign from being honoured next year. A code with
 * neither is a standing discount, and a standing discount belongs in the pass price.
 *
 * The caps and percentages here are the opening position and are meant to be edited: one
 * line per code, no other file involved.
 *
 * They stack with the early bird, because the early bird IS the pass price (see
 * listPriceInr in @/content/tickets) — SINGAM20 on the ₹499 Workshop Pass is 20% of ₹499,
 * not of ₹999. That is the conservative reading and the one the breakdown shows.
 */
export const coupons: Coupon[] = [
  {
    code: 'SINGAM20',
    kind: 'percent',
    value: 20,
    label: 'Startup Singam community',
    until: '2026-11-20',
    maxRedemptions: 150,
    note: 'Shared with the Startup Singam alumni and audience lists.',
  },
  {
    code: 'TBI25',
    kind: 'percent',
    value: 25,
    label: 'Incubator & TBI cohort',
    until: '2026-11-20',
    maxRedemptions: 100,
    note: 'Given to college incubation centres, private cells and TBIs for their cohorts.',
  },
  {
    code: 'PITCH200',
    kind: 'flat',
    value: 200,
    label: 'Founder track — ₹200 off',
    passes: [PITCH_TICKET_ID],
    until: '2026-11-20',
    maxRedemptions: 75,
    note: 'Investor Pitch Pass only, for founders referred by partners and mentors.',
  },
]

/**
 * What a typed code becomes before anything looks at it: uppercase, and stripped of
 * everything that is not a letter or a digit.
 *
 * People paste codes out of WhatsApp with a trailing space, type them with a hyphen that
 * was never there, and capitalise however their keyboard feels. None of that is a
 * different coupon, and all of it would be "invalid code" without this. Capped so a
 * megabyte of junk cannot reach the comparison loop.
 */
export function normaliseCode(raw: unknown): string {
  return typeof raw === 'string'
    ? raw
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 24)
    : ''
}

/** Today in IST as YYYY-MM-DD, so date bounds can be compared as strings. */
function istToday(now = new Date()): string {
  // en-CA formats as YYYY-MM-DD, which is why it is used here rather than en-IN.
  return now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
}

/** The coupon, or undefined. Match is on the normalised code, so case never matters. */
export function findCoupon(code: string): Coupon | undefined {
  const c = normaliseCode(code)
  return c ? coupons.find((x) => normaliseCode(x.code) === c) : undefined
}

/** What the coupon asks for, before @/lib/order-total clamps it. Whole rupees. */
function rawDiscountPaise(coupon: Coupon, subtotal: number): number {
  if (coupon.kind === 'flat') return Math.max(0, Math.round(coupon.value)) * 100
  const pct = Math.min(100, Math.max(0, coupon.value))
  // Rounded to the nearest whole rupee — not floored. Every other figure on this site is
  // a rupee multiple, and the half-rupee is not worth the asymmetry of always taking it.
  return Math.round((subtotal * pct) / 100 / 100) * 100
}

/** How the discount reads in the breakdown: "20% off · Startup Singam community". */
function discountLabel(coupon: Coupon): string {
  const amount = coupon.kind === 'percent' ? `${coupon.value}% off` : `₹${coupon.value} off`
  return `${amount} · ${coupon.label}`
}

export type CouponResult =
  | { ok: true; applied: AppliedDiscount; total: OrderTotal }
  /**
   * `error` is shown to the visitor verbatim, so every one of them says what to do next
   * rather than only that something is wrong.
   */
  | { ok: false; error: string }

/**
 * Check a code against a specific pass, and price it.
 *
 * Called twice per purchase and that is the point: once from the checkout so the customer
 * sees the discount before committing, and once from /api/payment/order at the moment the
 * amount is set. Both calls go through here, so the figure on the page is the figure
 * charged by construction rather than by agreement.
 *
 * `email` is optional because the checkout may ask about a code before the address is
 * typed. A `oncePerEmail` code therefore cannot be fully judged until the order is placed,
 * which is why the order endpoint passes it and the checkout may not — the one check that
 * matters happens where the money does.
 */
export function checkCoupon(args: {
  code: string
  ticket: Ticket
  extraMembers?: number
  email?: string
  now?: Date
}): CouponResult {
  const { ticket, extraMembers = 0, email, now = new Date() } = args
  const code = normaliseCode(args.code)
  if (!code) return { ok: false, error: 'Enter a coupon code.' }

  const coupon = findCoupon(code)
  // Deliberately the same answer for "no such code" and "not launched yet": a code that
  // exists but is not live yet is information about an unannounced campaign.
  if (!coupon || (coupon.from && istToday(now) < coupon.from)) {
    return { ok: false, error: 'That code is not valid. Check it and try again.' }
  }

  if (coupon.until && istToday(now) > coupon.until) {
    return { ok: false, error: 'That code has expired.' }
  }

  /*
   * The Free Pass has nothing to discount. Said as its own sentence because the reader
   * who typed a code on a free registration has not made a mistake — there is simply no
   * price there — and "not valid" would send them looking for a better code.
   */
  if (ticket.priceInr <= 0) {
    return { ok: false, error: 'This pass is already free — no code needed.' }
  }

  if (coupon.passes && !coupon.passes.includes(ticket.id)) {
    return { ok: false, error: `That code does not apply to the ${ticket.name}.` }
  }

  if (coupon.maxRedemptions || coupon.oncePerEmail) {
    const uses = couponUses(coupon.code)
    if (coupon.maxRedemptions && uses.total >= coupon.maxRedemptions) {
      return { ok: false, error: 'That code has been fully claimed.' }
    }
    if (coupon.oncePerEmail && email && uses.emails.includes(email.trim().toLowerCase())) {
      return { ok: false, error: 'That code has already been used with this email address.' }
    }
  }

  const subtotal = subtotalPaise(ticket, extraMembers)
  const label = discountLabel(coupon)
  const total = orderTotal(ticket, extraMembers, {
    code: coupon.code,
    label,
    discountPaise: rawDiscountPaise(coupon, subtotal),
  })

  /*
   * Clamped to nothing. Only reachable from a catalogue mistake — a flat coupon worth less
   * than a rupee, or a pass priced at ₹1 — and refused rather than applied as a ₹0
   * "discount", which would put a line in the breakdown that changes no number.
   */
  if (total.discountPaise <= 0) {
    return { ok: false, error: `That code cannot be applied to the ${ticket.name}.` }
  }

  return {
    ok: true,
    applied: { code: coupon.code, label, discountPaise: total.discountPaise },
    total,
  }
}
