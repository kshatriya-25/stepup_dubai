/**
 * The pass catalogue — the single source of truth for what is on sale, for how much,
 * what each pass opens, and which fields its form asks for.
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
 * gets to *choose* a price: it sends a pass `id`, and the server looks the amount up
 * from this same table. See src/app/api/payment/order/route.ts.
 *
 * ── August 2026 restructure ────────────────────────────────────────────────────
 * The three Day-1/Day-2 passes were replaced by a four-rung ladder (Free, Delegate,
 * Workshop, Investor Pitch) built around WHAT EACH ONE OPENS rather than which day it
 * admits. Each rung is a superset of the one below it, which is why `includes` is
 * written out in full per pass instead of being expressed as a diff: the cards show the
 * whole list, and a reader comparing two of them should not have to hold the lower
 * pass's contents in their head.
 */

/**
 * THE ON SWITCH FOR SELLING. Currently ON.
 *
 * false = clicking a pass opens a "booking opens soon" panel. No order is created,
 * Razorpay is never contacted, no money can move.
 *
 * true  = clicking opens the real form. Whether that form TAKES MONEY is a separate
 *         question, answered by REGISTRATION_PAYMENT_ENABLED in the server env: with
 *         the till closed the same pass opens the waitlist form instead of checkout.
 *
 * Two switches on purpose: this one is the shopfront (a code change, reviewed and in
 * git history), the env one is the till (ops, per environment). See the header of
 * src/components/home/Tickets.tsx for the full truth table.
 *
 * WHAT THIS DOES *NOT* DECIDE: whether real money moves. That is the key pair in the
 * server env. On `rzp_test_…` keys this opens a fully functional checkout that takes
 * fake payments. Check `GET /api/payment/order` on the box you deployed to: it reports
 * `mode: "LIVE" | "test"` without leaking the secret.
 *
 * The Free Pass ignores all of this — it has no price, so it never reaches Razorpay
 * under any combination of switches. See isFreePass().
 */
export const TICKET_SALES_LIVE = true

/** Free is a real pass, not a placeholder — and it must never reach Razorpay. */
export type TicketId = 'free' | 'delegate' | 'workshop' | 'investor-pitch'

/**
 * Who the attendee is coming as. This replaced the old free-text "register as", and it
 * does more than label them: it decides which organisation fields the form asks for,
 * what those fields are called, and whether an ID number is mandatory.
 *
 * 'public' is the only one with no organisation at all — everyone else is attached to
 * a startup or an incubator and the ID is how the desk verifies them at registration.
 */
export type CategoryId = 'founder' | 'college' | 'private' | 'tbi' | 'public'

export type CategoryConfig = {
  /** Radio-card title. */
  title: string
  /** One-line clarifier under the title. */
  hint: string
  /** Emoji marker, as supplied in the client's forms. */
  icon: string
  /** False for 'public' — no organisation block at all. */
  showOrg: boolean
  /** Label + placeholder for the organisation name field. */
  orgLabel: string
  orgPlaceholder: string
  /** Label + placeholder for the ID field, and whether it is mandatory. */
  idLabel: string
  idPlaceholder: string
  idRequired: boolean
  /** Hint under the designation field. */
  roleHint: string
}

export const categories: Record<CategoryId, CategoryConfig> = {
  founder: {
    title: 'Startup Founder',
    hint: 'Founder / co-founder',
    icon: '🚀',
    showOrg: true,
    orgLabel: 'Startup name',
    orgPlaceholder: 'e.g. Your startup name',
    idLabel: 'DPIIT / registration number',
    idPlaceholder: 'e.g. DPIIT12345 (if applicable)',
    // A founder may genuinely not have a registration number yet — an idea-stage
    // startup has nothing to quote. Demanding one would turn away exactly the people
    // the summit exists for.
    idRequired: false,
    roleHint: 'e.g. Founder, Co-founder',
  },
  college: {
    title: 'College Incubation Center',
    hint: 'Registered college incubation cell',
    icon: '🎓',
    showOrg: true,
    orgLabel: 'College Incubation Center name',
    orgPlaceholder: 'e.g. PSG-STEP Incubation Center',
    idLabel: 'Incubation Center ID',
    idPlaceholder: 'e.g. CIC-00219',
    idRequired: true,
    roleHint: 'e.g. Student Founder, Program Coordinator',
  },
  private: {
    title: 'Private Incubation',
    hint: 'Registered incubation cell member',
    icon: '🏢',
    showOrg: true,
    orgLabel: 'Incubation cell / company name',
    orgPlaceholder: 'e.g. XYZ Incubation Cell',
    idLabel: 'Registration / employee ID',
    idPlaceholder: 'e.g. INC-00219',
    idRequired: true,
    roleHint: 'e.g. Founder, Intern, Mentor',
  },
  tbi: {
    title: 'TBI Member',
    hint: 'Technology Business Incubator',
    icon: '🏛️',
    showOrg: true,
    orgLabel: 'TBI name',
    orgPlaceholder: 'e.g. ABC Technology Business Incubator',
    idLabel: 'TBI registration number',
    idPlaceholder: 'e.g. TBI-00219',
    idRequired: true,
    roleHint: 'e.g. Startup Founder, Program Manager',
  },
  public: {
    title: 'Public',
    hint: 'No affiliation required',
    icon: '🌐',
    showOrg: false,
    orgLabel: '',
    orgPlaceholder: '',
    idLabel: '',
    idPlaceholder: '',
    idRequired: false,
    roleHint: '',
  },
}

/** One line in a pass's "What it opens" list. */
export type PassFeature = { label: string; detail: string }

/** The extra question groups a pass's form adds on top of the common ones. */
export type PassFormSpec = {
  /** Which categories this pass offers. Free is incubation-only — see the note there. */
  categories: CategoryId[]
  /** Workshop choice + the Power Networking Corner block. */
  workshop?: boolean
  /** Startup / stage / pitch block, plus chargeable extra team members. */
  startup?: boolean
}

export type Ticket = {
  id: TicketId
  /** Small caps line above the name, e.g. "Delegate · Visitor". */
  eyebrow: string
  name: string
  blurb: string
  /** Whole rupees. Converted to paise server-side; never a float in maths. 0 = free. */
  priceInr: number
  /** "Per Person" / "For One Member (Founder)" — printed under the price. */
  unit: string
  /** Per-head price for additional people from the same startup. Pitch pass only. */
  extraMemberInr?: number
  /*
   * THERE IS NO `cta` FIELD, and there must not be one.
   *
   * There was: every pass carried `cta: 'Join Waitlist'` and nothing ever read it. The
   * button label cannot be a per-pass constant, because it has to say what clicking will
   * actually DO — "Book now" when the till is open, "Join the waitlist" when it is shut,
   * "Register for free" for a pass that never reaches Razorpay at all. Two of those three
   * depend on server state this file cannot see.
   *
   * A dead field named `cta` is worse than no field: the obvious place to go when asked
   * to change a button label is the one labelled `cta`, and editing it changes nothing.
   * The label is computed in home/Tickets.tsx and passes/PassCheckout.tsx, from the same
   * three inputs, and those two must agree.
   */
  /** Filled orange button vs outlined navy. See the note on the type below. */
  emphasis: 'solid' | 'outline'
  /** Colour of the rule above the eyebrow. Maps to a token in tailwind.config.ts. */
  accent: 'accent' | 'cyan' | 'green' | 'gold'
  /** Availability chip — "Limited Seats", "Open", "By Selection". Static copy. */
  badge: string
  /** One-line summary of what the pass opens. Used in the sheet and the receipt. */
  accessSummary: string
  includes: PassFeature[]
  /** Plain-language summary of what this pass does NOT open. '' for the top rung. */
  excludes: string
  /** Extra small print shown under the list. */
  note?: string
  form: PassFormSpec
}

/** Every pass below the top rung offers the full set of categories. */
const ALL_CATEGORIES: CategoryId[] = ['founder', 'college', 'private', 'tbi', 'public']

export const tickets: Ticket[] = [
  {
    id: 'free',
    eyebrow: 'Visitor · Limited Count',
    name: 'Free Pass',
    blurb:
      'Walk the stall zone and sit in on the open-hall speaker sessions. Limited count — released in batches until they run out.',
    priceInr: 0,
    unit: 'Limited Count',
    emphasis: 'solid',
    accent: 'cyan',
    badge: 'Limited Seats',
    accessSummary: 'Stall zone · Main hall',
    includes: [
      { label: 'Stall Zone', detail: '25 stalls — paid + partner' },
      { label: 'Main Hall', detail: 'Speaker sessions, open hall' },
    ],
    excludes: 'Delegate kit · Lunch coupon · Power Networking Corner · Workshop session · Investor pitch track',
    // The desk verifies every free pass against an ID before letting anyone in — that is
    // what makes a limited, incubator-allocated batch defensible when it runs out. Said
    // here rather than only in the confirmation email so nobody registers, travels to
    // Erode and finds out at the door.
    note: 'A valid ID card is mandatory for entry for Free Pass holders and must be shown at the entrance.',
    form: {
      // NOT the full set, and deliberately so: the free pass is allocated through
      // incubation centres, so there is no 'public' or unaffiliated 'founder' route to
      // one. Every free-pass holder is verifiable against an incubator ID at the desk,
      // which is what makes a limited batch defensible when it runs out.
      categories: ['college', 'private', 'tbi'],
    },
  },
  {
    id: 'delegate',
    eyebrow: 'Delegate · Visitor',
    name: 'Delegate Pass',
    blurb:
      'Everything in the free pass, plus the delegate kit and a regular lunch coupon. Walk up to scheme officers, investors and bank heads without an introduction.',
    priceInr: 299,
    unit: 'Per Person',
    emphasis: 'solid',
    accent: 'accent',
    badge: 'Open',
    accessSummary: 'Stall zone · Main hall · Delegate kit · Lunch',
    includes: [
      { label: 'Stall Zone', detail: '25 stalls — paid + partner' },
      { label: 'Main Hall', detail: 'Speaker sessions, open hall' },
      { label: 'Delegate Kit', detail: 'Handed at registration' },
      { label: 'Lunch Coupon', detail: 'Regular lunch' },
    ],
    excludes: 'Power Networking Corner · Workshop session · Investor pitch track',
    form: { categories: ALL_CATEGORIES },
  },
  {
    id: 'workshop',
    eyebrow: 'Workshop · Working Session',
    name: 'Workshop Pass',
    blurb:
      'One focused working session in the hall, plus the Power Networking Corner — pre-booked peer, partner and investor appointments. Power networking lunch included.',
    priceInr: 999,
    unit: 'Per Person',
    emphasis: 'solid',
    accent: 'green',
    badge: 'Pre-booked',
    accessSummary: 'Main hall · Delegate kit · Power lunch · Networking · 1 workshop',
    includes: [
      { label: 'Stall Zone', detail: '25 stalls — paid + partner' },
      { label: 'Main Hall', detail: 'Speaker sessions, open hall' },
      { label: 'Delegate Kit', detail: 'Handed at registration' },
      { label: 'Lunch Coupon', detail: 'Power networking lunch' },
      { label: 'Power Networking Corner', detail: 'Pre-booked peer / partner / investor appointments' },
      { label: 'Workshop — 1 session', detail: 'Focused working session in the hall' },
    ],
    excludes: 'Investor pitch track — bootcamp, investor connect, one-on-one pitch, Golden Pass',
    form: { categories: ALL_CATEGORIES, workshop: true },
  },
  {
    id: 'investor-pitch',
    eyebrow: 'Founder · Investor Pitch',
    name: 'Investor Pitch Pass',
    blurb:
      'The full founder track — pitch bootcamp, focused workshops and data scrutiny, then connect with investors and a closed-room one-on-one pitch for eligible startups. The best selected startup carries the Golden Pass to Startup Singam Season 3.',
    priceInr: 2999,
    unit: 'For One Member (Founder)',
    extraMemberInr: 999,
    emphasis: 'solid',
    accent: 'gold',
    badge: 'By Selection',
    accessSummary: 'Full founder track · Pitch bootcamp · Investor connect',
    includes: [
      { label: 'Stall Zone', detail: '25 stalls — paid + partner' },
      { label: 'Main Hall', detail: 'Speaker sessions, open hall' },
      { label: 'Delegate Kit', detail: 'Handed at registration' },
      { label: 'Lunch Coupon', detail: 'Power networking lunch' },
      { label: 'Power Networking Corner', detail: 'Pre-booked peer / partner / investor appointments' },
      { label: 'Pitch Bootcamp', detail: 'Focused workshops & data scrutiny' },
      { label: 'Connect with Investors', detail: 'For eligible startups' },
      { label: 'One-on-one Investor Pitch', detail: 'Closed-room session, for eligible startups' },
      { label: 'Golden Pass — Startup Singam S3', detail: 'For the best selected startup' },
    ],
    excludes: '',
    note: 'The standalone workshop session is not part of this pass — the pitch bootcamp and its focused workshops run in its place. ₹2,999 covers one member (the founder) — ₹999 for each extra person from the startup.',
    form: { categories: ALL_CATEGORIES, startup: true },
  },
]

/** Workshop choices. Titles are placeholders until the programme is finalised. */
export const workshopOptions = [
  { value: 'workshop-1', label: 'Workshop A — Details to be announced' },
  { value: 'workshop-2', label: 'Workshop B — Details to be announced' },
  { value: 'workshop-3', label: 'Workshop C — Details to be announced' },
] as const

/** Who a Power Networking Corner appointment should be with. */
export const meetingTypeOptions = [
  { value: 'peer', label: 'Peer founder' },
  { value: 'partner', label: 'Potential partner' },
  { value: 'investor', label: 'Investor' },
] as const

/** How far along the startup is. Investor pitch pass only. */
export const stageOptions = [
  { value: 'idea', label: 'Idea stage' },
  { value: 'prototype', label: 'Prototype / MVP' },
  { value: 'early', label: 'Early revenue' },
  { value: 'scaling', label: 'Scaling' },
] as const

/** Cap on chargeable extra team members, so one form cannot invoice for a coachload. */
export const MAX_EXTRA_MEMBERS = 5

/**
 * What the sheet's Payment Status column says for a free-pass registration.
 *
 * NOT "Waitlist", which is what it used to say and what a PAID pass still says when the
 * till is closed. Those are two different things now: a waitlist row is somebody we owe
 * a "passes are open" email to, a free-pass row is a confirmed attendee who will walk up
 * to the desk.
 *
 * FROM HERE ON ONLY — the rows already in the sheet were deliberately not rewritten. Free
 * passes registered before August 2026 still say "Waitlist", because that is all the
 * column meant when they were written, and a bulk edit months later would restate history
 * with nothing in Sheets to explain it. So this string identifies NEW registrations, not
 * every free-pass holder, and nothing may assume otherwise.
 *
 * Anything that needs "is this person coming?" should therefore read the TICKET column,
 * where a free pass is a free pass whatever era it was registered in — that is what the
 * door list in docs/SHEET-VIEWS.md keys on, and why it needs no backfill to stay right.
 *
 * Defined here rather than at either use site because THREE things have to agree: the
 * cell written by /api/register, the sentence in the organiser alert that tells a human
 * what to search the sheet for, and the eyebrow on the registrant's own confirmation.
 * The en dash is the client's, from the approved artwork — do not "fix" it to a hyphen
 * or a saved filter will stop matching.
 */
export const FREE_PASS_STATUS = 'Registered – Free Pass Entry'

export const ticketsNote = 'All prices inclusive of GST · Pitch slots are subject to selection'

export const passesIntro =
  'Four ways in. Every paid pass carries the delegate kit and a lunch coupon. Power networking and the investor pitch track open up as you move up the ladder.'

/**
 * What a pass opens, as one line. Named for its callers — the receipt email, the paid
 * sheet row and the waitlist sheet row all want the same short answer, and reading it
 * from here means a receipt can never describe a pass differently from the card that
 * sold it. Returns null for an unknown id so each caller picks its own fallback.
 */
export function ticketAccess(id: string | undefined | null): string | null {
  return ticketById(id)?.accessSummary ?? null
}

/** Look a pass up by id. Returns undefined for anything not in the table. */
export function ticketById(id: string | undefined | null): Ticket | undefined {
  return tickets.find((t) => t.id === id)
}

/** No money, no Razorpay, no order. The free pass is a registration and nothing else. */
export function isFreePass(t: Ticket): boolean {
  return t.priceInr <= 0
}

/**
 * Price in integer paise — the only form money should ever be handled in.
 * `0.1 + 0.2 !== 0.3`, and Razorpay's API is paise-denominated anyway.
 *
 * `extraMembers` is charged at the pass's own per-head rate. A pass with no extra-member
 * price ignores the count entirely rather than falling back to the base price, so a
 * crafted request cannot bill a Delegate Pass twice by claiming a team.
 */
export function ticketPaise(t: Ticket, extraMembers = 0): number {
  const extras = t.extraMemberInr ? Math.max(0, extraMembers) * t.extraMemberInr : 0
  return Math.round((t.priceInr + extras) * 100)
}

/** 2999 → "₹2,999", and 0 → "Free". Display only. */
export function formatTicketPrice(t: Ticket): string {
  return isFreePass(t) ? 'Free' : `₹${t.priceInr.toLocaleString('en-IN')}`
}

/** 99900 → "₹999". Display only. */
export function formatInrRupees(rupees: number): string {
  return `₹${rupees.toLocaleString('en-IN')}`
}
