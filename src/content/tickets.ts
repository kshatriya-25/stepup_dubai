/**
 * The ticket catalogue — the single source of truth for what is on sale and for how
 * much.
 *
 * WHY THE PRICE LIVES HERE AND NOT IN .env
 * The server prices an order from this file and the page renders its price tags from
 * the same import, so the amount shown and the amount charged are the same constant
 * and cannot drift. An env var could not give that guarantee: this page is statically
 * prerendered, so an env price gets frozen into the HTML at build time and a later
 * change would leave the page advertising one figure while the server charged another.
 *
 * Changing a price is therefore a code change — which is correct for money. It goes
 * through review and lands in git history, where you can see who changed it and when.
 *
 * SAFE TO IMPORT FROM CLIENT CODE. Nothing secret is in here. The browser still never
 * gets to *choose* a price: it sends a ticket `id`, and the server looks the amount up
 * from this same table. See src/app/api/payment/order/route.ts.
 */

/**
 * THE ON SWITCH FOR SELLING. Currently OFF.
 *
 * false = clicking a ticket opens a "booking opens soon" panel. No order is created,
 * Razorpay is never contacted, no money can move. The cards, prices and the entire
 * checkout flow are built and wired behind this — it is a display decision, not a
 * missing feature.
 *
 * true  = clicking opens the real checkout sheet and Razorpay.
 *
 * Going live needs BOTH this and `REGISTRATION_PAYMENT_ENABLED=1` in the server env.
 * Two switches on purpose: this one is the shopfront (a code change, reviewed and in
 * git history), the env one is the till (ops, per environment). Either being off means
 * nobody can be charged, so a half-finished go-live fails closed.
 */
export const TICKET_SALES_LIVE = false

export type TicketId = 'delegate' | 'investor-pitch' | 'founder'

export type Ticket = {
  id: TicketId
  /** Small caps line above the name, e.g. "Delegate · Visitor". */
  eyebrow: string
  name: string
  blurb: string
  /** Whole rupees. Converted to paise server-side; never a float in maths. */
  priceInr: number
  /** "per person" / "per startup" — printed under the price. */
  unit: string
  /** Button label. "Book" buys a seat; "Apply" buys a slot that is still selected on. */
  cta: string
  /**
   * Filled orange button vs outlined navy.
   *
   * All three are 'solid' today: each card's button is the one and only action on that
   * card, so there is no secondary CTA for an outline to rank below — an outlined one
   * just read as disabled next to its orange neighbours. 'outline' is kept for a future
   * card that genuinely needs to sit lower in the hierarchy.
   */
  emphasis: 'solid' | 'outline'
  /** Colour of the rule above the eyebrow. Maps to a token in tailwind.config.ts. */
  accent: 'accent' | 'cyan' | 'green'
  /** The four small columns along the bottom of the stub. */
  meta: { label: string; value: string }[]
}

export const tickets: Ticket[] = [
  {
    id: 'delegate',
    eyebrow: 'Delegate · Visitor',
    name: 'Delegate Pass',
    blurb:
      'Day 2, every growth zone, the startup exhibit and the live finale. Walk up to scheme officers, investors and bank heads without an introduction.',
    priceInr: 999,
    unit: 'per person',
    cta: 'Book',
    emphasis: 'solid',
    accent: 'accent',
    meta: [
      { label: 'Access', value: 'Day 2' },
      { label: 'Meals', value: 'Lunch' },
      { label: 'Kit', value: 'Delegate' },
      // NOTE: seat counts are static copy, not live inventory — nothing decrements
      // them when a ticket sells. See the warning in PAYMENTS.md before advertising a
      // number that could run out.
      { label: 'Seats', value: 'Open' },
    ],
  },
  {
    id: 'investor-pitch',
    eyebrow: 'Founder · Day 2',
    name: 'Investor Pitch Day',
    blurb:
      'One day, one room, one pitch. Slot in front of the investor panel with feedback on the spot.',
    priceInr: 2599,
    unit: 'per startup',
    cta: 'Apply',
    emphasis: 'solid',
    accent: 'cyan',
    meta: [
      { label: 'Access', value: 'Day 2' },
      { label: 'Meals', value: 'Lunch' },
      { label: 'Kit', value: 'Delegate' },
      { label: 'Seats', value: '14 / 40 left' },
    ],
  },
  {
    id: 'founder',
    eyebrow: 'Founder · Full Programme',
    name: 'Founder Programme',
    blurb:
      'Day 1 bootcamp on the pitch, cap table and data room. Day 2 in front of the panel. Ten startups coached, three reach the main stage.',
    priceInr: 3999,
    unit: 'per startup',
    cta: 'Apply',
    emphasis: 'solid',
    accent: 'green',
    meta: [
      { label: 'Access', value: 'Day 1 + Day 2' },
      { label: 'Meals', value: 'Dinner + Lunch' },
      { label: 'Kit', value: 'Founder' },
      { label: 'Seats', value: '9 / 30 left' },
    ],
  },
]

export const ticketsNote = 'All prices inclusive of GST · Pitch slots are subject to selection'

/** Look a ticket up by id. Returns undefined for anything not in the table. */
export function ticketById(id: string | undefined | null): Ticket | undefined {
  return tickets.find((t) => t.id === id)
}

/**
 * Price in integer paise — the only form money should ever be handled in.
 * `0.1 + 0.2 !== 0.3`, and Razorpay's API is paise-denominated anyway.
 */
export function ticketPaise(t: Ticket): number {
  return Math.round(t.priceInr * 100)
}

/** 2599 → "₹2,599". Display only. */
export function formatTicketPrice(t: Ticket): string {
  return `₹${t.priceInr.toLocaleString('en-IN')}`
}
