/**
 * THE PRICED CATALOGUE — what the server actually charges and shows.
 *
 * @/content/tickets holds the real prices, in code, for the reasons written at the top
 * of that file: the page and the order endpoint import the same constant, so the amount
 * displayed and the amount charged cannot drift. Nothing here changes that. This module
 * exists for exactly one job:
 *
 *   SMOKE-TESTING A LIVE RAZORPAY KEY WITHOUT MOVING ₹2,999.
 *
 * Live keys behave differently from `rzp_test_…` — real UPI apps, real bank OTP pages,
 * real settlement, real webhooks from Razorpay's production fleet. The only way to know
 * the live wiring works is to push a real payment through it, and the only sane amount
 * to do that with is a couple of rupees. So staging runs the real code, the real keys and
 * the real flow at TICKET_PRICE_OVERRIDE_INR rupees a pass.
 *
 * ── THE THREE GUARDS ───────────────────────────────────────────────────────────
 * A variable that rewrites prices is a variable that can give the summit away, so it is
 * deliberately hard to fire by accident:
 *
 *   1. IT IS IGNORED ON PRODUCTION, and that guard is COMPILED IN. isProductionSite is
 *      derived from the hard-coded origin in @/lib/site-env, not from a flag a copied
 *      .env could claim — and because it reads NEXT_PUBLIC_SITE_URL, Next inlines the
 *      comparison at BUILD time, server bundle included. A build made for tier2rising.com
 *      therefore contains `isProductionSite = true` as a literal: no environment variable
 *      set later, and no restart, can switch the override on. It would take a rebuild
 *      under a different site URL, at which point it is no longer the production site.
 *   2. IT MUST BE A SMALL WHOLE NUMBER OF RUPEES (1–100). A test price is a test price.
 *      Anything outside that is a typo, not an intention, and is refused rather than
 *      charged.
 *   3. IT ANNOUNCES ITSELF. Every surface that shows or takes money says the prices are
 *      not real — the pass section, the checkout page, the receipt and the organiser
 *      alert. A ₹2 charge on live keys produces a genuine Razorpay receipt; without the
 *      banner that email is indistinguishable from a real sale.
 *
 * THE FREE PASS IS NEVER TOUCHED. It has no price to override, and isFreePass() must
 * keep answering true for it under every configuration — see @/content/tickets.
 *
 * SERVER ONLY, and it has to be. Client components receive their `ticket` as a prop from
 * a server component (see /passes/[pass]/page.tsx and home/Tickets.tsx), so the override
 * reaches the browser as data, not as another env var to inline at build time.
 */

import 'server-only'
import { isProductionSite, siteUrl } from '@/lib/site-env'
import { tickets, type Ticket } from '@/content/tickets'

const RAW = (process.env.TICKET_PRICE_OVERRIDE_INR || '').trim()

/** A test price is a couple of rupees. Anything larger is a mistake. */
const MIN_INR = 1
const MAX_INR = 100

function resolveOverride(): number | null {
  if (!RAW) return null

  if (isProductionSite) {
    console.error(
      `[pricing] TICKET_PRICE_OVERRIDE_INR=${RAW} IGNORED — this build is the production site ` +
        `(${siteUrl}). Real prices are in effect. Remove it from the production .env.`,
    )
    return null
  }

  const n = Number(RAW)
  if (!Number.isInteger(n) || n < MIN_INR || n > MAX_INR) {
    console.error(
      `[pricing] TICKET_PRICE_OVERRIDE_INR=${RAW} IGNORED — it must be a whole number of ` +
        `rupees between ${MIN_INR} and ${MAX_INR}. Real prices are in effect.`,
    )
    return null
  }

  console.warn(
    `[pricing] TEST PRICING ACTIVE — every paid pass costs ₹${n} on ${siteUrl}. ` +
      `Payments made here are real if the Razorpay keys are live.`,
  )
  return n
}

/** The test price in whole rupees, or null when real prices are in effect. */
export const priceOverrideInr = resolveOverride()

/** True when the site is selling at a test price. Drives every "not real" banner. */
export const testPricing = priceOverrideInr !== null

/**
 * The catalogue as this deployment sells it.
 *
 * Both the base price and the per-extra-member price are overridden. Overriding only the
 * base would leave an Investor Pitch Pass with one extra member at ₹2 + ₹999 — a real
 * charge nobody meant to make, arrived at by testing.
 */
export const pricedTickets: Ticket[] =
  priceOverrideInr === null
    ? tickets
    : tickets.map((t) =>
        t.priceInr <= 0
          ? t
          : {
              ...t,
              priceInr: priceOverrideInr,
              ...(t.extraMemberInr ? { extraMemberInr: priceOverrideInr } : {}),
              /*
               * The early-bird "was" price goes with it. Left in, staging would show ₹2 with
               * ₹1,999 struck through beside it and a "Save ₹1,997" badge — a fake discount
               * on a fake price, on the one deployment whose whole job is to make the test
               * price obvious. An offer is a claim about money, so it is dropped wherever
               * the money is not real.
               */
              listPriceInr: undefined,
            },
      )

/**
 * Look a pass up at the price this deployment charges.
 *
 * Every server path that resolves a pass for money goes through here rather than
 * ticketById(), so there is no route by which the page can show one number and the order
 * endpoint charge another.
 */
export function pricedTicketById(id: string | undefined | null): Ticket | undefined {
  return pricedTickets.find((t) => t.id === id)
}
