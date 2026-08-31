// Tier-2 Rising content — human-story copy from the v1 build. Navy/Orange brand.
// Canonical facts: one day (Sat 10 Oct 2026), Fortune City Erode, ticketed.

export const site = {
  name: 'Tier-2 Rising',
  fullName: 'Tier-2 Rising Startup Summit',
  season: 'In association with Startup Singam',
  initiativeBy: 'NammaOffice Presents',
  // Namma Office's own strapline, shown under their wordmark in the header.
  /*
   * presenterTagline is GONE.
   *
   * It was the third line of the Namma Office lockup in the header, and that whole lockup
   * has moved into the hero panel — where a co-working strapline under the presenter's
   * wordmark is one line of detail too many next to a 64px logo. Deleted rather than left
   * exported and unused, for the same reason given below about participateRoutes: a
   * content constant nothing renders gets found by the next person and used.
   */
  theme: 'When investors, government grants and bank funding come to Tier-2 — not the other way around',
  tagline: 'Where Tier-2 startups become funding-ready',
  taglineLong:
    'The day investors, government grants and bank funding come to Tier-2 — instead of Tier-2 going looking for them. A flagship event under the Tier-2 Rising campaign by NammaOffice.',
  headline: 'TIER-2 RISING',
  subhead: 'Startup Summit',
  // ONE DAY, Saturday 10 October 2026. It was a two-day event until August 2026 and
  // the copy said so in a dozen places; every one of them now reads from here.
  // `dates` is the only string the site prints, so shortening it is a one-line change.
  dates: '10 October 2026',
  datesShort: 'Saturday',
  startISO: '2026-10-10T09:00:00+05:30',
  venue: 'Fortune City',
  // Shown as a second line under the venue chip in the header. Fortune City alone is
  // ambiguous to anyone outside Erode; this is the locality that makes it findable.
  venueArea: '(Tex Valley, Erode)',
  city: 'Erode, Tamil Nadu',
  entry: 'Ticketed · details announced soon',
  // Every "Register" button on the site reads this — header, hero, mobile nav. It
  // pointed at #register, the free waitlist form, which no longer exists: registering
  // now means picking one of the four passes, so the CTA lands on the pass ladder and
  // the form there collects the details the waitlist used to.
  register: '#tickets',
  // Public contact details shown on the site. Separate from the transactional sender
  // (MAIL_FROM / MAIL_REPLY_TO in .env) that the registration emails go out as.
  contactEmail: 'tier2rising@nammaoffice.com',
  contactPhone: '+91 90921 09213',
}

// The Apps Script /exec URL is no longer read here — the browser posts to
// /api/register, and that route reads NEXT_PUBLIC_REGISTRATION_ENDPOINT server-side.
// See REGISTRATION-SETUP.md and EMAIL-SETUP.md.

// NEXT_PUBLIC_REGISTRATION_OPEN used to be read here, to swap the free waitlist form
// between "live" and "opening soon". That section is gone and nothing reads the var any
// more — whether you can sign up is now purely a question of whether passes are on
// sale, which is TICKET_SALES_LIVE in @/content/tickets plus the server's
// REGISTRATION_PAYMENT_ENABLED. Setting it in the environment is harmless but has no
// effect; do not add a third switch here.

/*
 * registrationRoles, registerAsOptions and registrationSectors lived here and are gone.
 *
 * The August 2026 pass restructure replaced all three. "Register as" became `categories`
 * in @/content/tickets — a five-way choice that also decides which organisation fields
 * the form asks for, so it could not stay a bare string list. The 30-entry industry
 * dropdown became a free-text "Sector / industry" asked only on the Investor Pitch Pass,
 * because it was the only pass that ever used the answer.
 *
 * Deleted rather than left in place: an exported option list that nothing renders is a
 * trap, because the next person to need one finds it, uses it, and reintroduces a
 * vocabulary the rest of the system stopped speaking.
 */

// Tamil Nadu cities / towns (searchable). 'Other' as a fallback.
export const tamilNaduCities = [
  'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Tiruppur', 'Erode',
  'Vellore', 'Thoothukudi', 'Dindigul', 'Thanjavur', 'Ranipet', 'Sivakasi', 'Karur', 'Ooty (Udhagamandalam)',
  'Hosur', 'Nagercoil', 'Kanchipuram', 'Kumbakonam', 'Cuddalore', 'Pudukkottai', 'Ambur', 'Tambaram',
  'Avadi', 'Tiruvannamalai', 'Nagapattinam', 'Viluppuram', 'Rajapalayam', 'Neyveli', 'Namakkal', 'Karaikudi',
  'Vaniyambadi', 'Theni', 'Arakkonam', 'Virudhunagar', 'Srivilliputhur', 'Tindivanam', 'Virudhachalam',
  'Chidambaram', 'Mannargudi', 'Tiruchengode', 'Perambalur', 'Ariyalur', 'Krishnagiri', 'Dharmapuri',
  'Palani', 'Pollachi', 'Mettupalayam', 'Sankarankovil', 'Tenkasi', 'Pattukkottai', 'Arani', 'Sivaganga',
  'Ramanathapuram', 'Paramakudi', 'Aruppukkottai', 'Kovilpatti', 'Bodinayakanur', 'Oddanchatram',
  'Vedaranyam', 'Tiruvarur', 'Mayiladuthurai', 'Sirkazhi', 'Jayankondam', 'Chengalpattu', 'Gummidipoondi',
  'Ponneri', 'Tiruvallur', 'Sriperumbudur', 'Walajapet', 'Arcot', 'Tirupathur', 'Harur', 'Denkanikottai',
  'Kangeyam', 'Dharapuram', 'Udumalaipettai', 'Valparai', 'Gobichettipalayam', 'Bhavani', 'Sathyamangalam',
  'Mettur', 'Attur', 'Omalur', 'Rasipuram', 'Sankagiri', 'Palladam', 'Avinashi', 'Coonoor', 'Kotagiri',
  'Gudalur', 'Other',
] as const

export type NavItem = { label: string; href: string; children?: { label: string; href: string }[] }

/**
 * The five "explore" destinations, defined once and used in two places: the About
 * hover menu in the header, and the Explore column in the footer.
 *
 * Shared deliberately. The footer used to build its own hrefs by slugifying its
 * labels — 'Our Vision' -> '#our-vision' — and four of the five anchors it produced
 * did not exist on the page, so those links scrolled nowhere. Pointing both lists at
 * one array is what stops the menu and the footer drifting apart again.
 *
 * Every href below must match a real `id` on a <section>. Current anchors:
 *   #vision  #story  #zones  #whatgoeson  #partners  #tickets
 */
export const exploreLinks: { label: string; href: string }[] = [
  { label: 'Our Vision', href: '#vision' },
  { label: 'Growth Zones', href: '#zones' },
  { label: 'Key Initiatives', href: '#whatgoeson' },
  { label: 'Tickets', href: '#tickets' },
  { label: 'Partners', href: '#partners' },
  // NOTE: there is no dedicated "Who Attends" section yet. Growth Zones is the closest
  // real destination — it is the part of the page that names who is actually in the
  // room (scheme officers, investors, bank credit heads). Repoint this the moment a
  // proper section exists.
  { label: 'Who Attends', href: '#zones' },
]

export const nav: NavItem[] = [
  // The parent still navigates to #story ("Why We Built the Room") on click. The
  // children only appear on hover, so adding them must not — and does not — change
  // what clicking About does.
  { label: 'About', href: '#story', children: exploreLinks },
  { label: 'Programme', href: '#zones' },
  { label: 'Startups', href: '#whatgoeson' },
  { label: 'Tickets', href: '#tickets' },
  { label: 'Partners', href: '#partners' },
]

/*
 * participateRoutes is GONE, and must not come back.
 *
 * It fed a "Participate" dialog in the header that offered three ways in. Two of them —
 * "Attend" and "Nominate a Startup" — both resolved to '#tickets': Attend duplicated the
 * REGISTER button sitting next to it, and Nominate had nowhere real to go because the
 * Startup Singam URL was never supplied. Only "Partner with us" led anywhere the reader
 * could not already reach, so the menu was a click of ceremony in front of one form.
 *
 * The header button now says "Partner with us" and opens that form directly. Deleted
 * rather than left exported and unused, for the reason given above about the sectors
 * list: an option table nothing renders is found by the next person, used, and the
 * decoys come back.
 *
 * If Nominate a Startup ever gets its real URL, it belongs in `nav` or `exploreLinks`
 * as a link — not behind a dialog.
 */

// The footer renders these as icons, so `label` is the accessible name rather than
// visible text — screen readers and hover tooltips both read it.
//
// TODO: every href is still a '#' placeholder. Fill in the real profile URLs; until
// then the icons render but go nowhere.
export type Social = { label: string; href: string; icon: 'linkedin' | 'instagram' | 'x' | 'youtube' }

export const socials: Social[] = [
  { label: 'LinkedIn', href: '#', icon: 'linkedin' },
  { label: 'Instagram', href: '#', icon: 'instagram' },
  { label: 'X', href: '#', icon: 'x' },
  { label: 'YouTube', href: '#', icon: 'youtube' },
]
