// Tier-2 Rising content — human-story copy from the v1 build. Navy/Orange brand.
// Canonical facts: one day (Sun 11 Oct 2026), Fortune City Erode, ticketed.

export const site = {
  name: 'Tier-2 Rising',
  fullName: 'Tier-2 Rising Startup Summit',
  season: 'In association with Startup Singam',
  initiativeBy: 'NammaOffice Presents',
  // Namma Office's own strapline, shown under their wordmark in the header.
  presenterTagline: 'Your Co-Working Destination',
  theme: 'When investors, government grants and bank funding come to Tier-2 — not the other way around',
  tagline: 'Where Tier-2 startups become funding-ready',
  taglineLong:
    'The weekend investors, government grants and bank funding come to Tier-2 — instead of Tier-2 going looking for them. A flagship event under the Tier-2 Rising campaign by NammaOffice.',
  headline: 'TIER-2 RISING',
  subhead: 'Startup Summit',
  dates: '10 & 11 October 2026',
  datesShort: 'Sat & Sun',
  startISO: '2026-10-10T09:00:00+05:30',
  venue: 'Fortune City',
  // Shown as a second line under the venue chip in the header. Fortune City alone is
  // ambiguous to anyone outside Erode; this is the locality that makes it findable.
  venueArea: '(Tex Valley, Erode)',
  city: 'Erode, Tamil Nadu',
  entry: 'Ticketed · details announced soon',
  // Every "Register" button on the site reads this — header, hero, mobile nav. It
  // pointed at #register, the free waitlist form, which no longer exists: registering
  // now means buying one of the three passes, so the CTA lands on the passes and the
  // checkout sheet collects the details the waitlist used to.
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

export const registrationRoles = [
  'Founder',
  'Investor',
  'Government / Bank',
  'Ecosystem / Mentor',
  'Media',
  'Other',
] as const

// "Register as" — who the attendee is coming as. Sits after Sector in the form.
export const registerAsOptions = ['Company', 'Government', 'Public', 'Student'] as const

export const registrationSectors = [
  'Agriculture',
  'Automobile',
  'Arts and Crafts',
  'Automobile components',
  'Aviation',
  'Biotechnology',
  'Chemical',
  'Construction',
  'Defence manufacturing',
  'Education',
  'Electrical machinery',
  'Electronic systems',
  'Food Processing',
  'Health',
  'IT and BPM',
  'Leather',
  'Media and entertainment',
  'Mining',
  'Oil and gas',
  'Pharmaceuticals',
  'Ports and shipping',
  'Railways',
  'Renewable energy',
  'Roads and highways',
  'Space',
  'Textiles and garments',
  'Thermal power',
  'Tourism and hospitality',
  'Wellness',
  'Other',
] as const

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
 *   #story  #zones  #whatgoeson  #partners  #tickets
 */
export const exploreLinks: { label: string; href: string }[] = [
  { label: 'Our Vision', href: '#story' },
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

// `action: 'partner'` swaps the modal to the enquiry form instead of navigating.
// TODO: 'Nominate a Startup' should point at the Startup Singam URL once we have it.
// Until then it falls back to the passes — nominating means entering the Top 10
// shortlist, which is what the Founder Programme pass buys.
export const participateRoutes: {
  label: string
  desc: string
  href?: string
  action?: 'partner'
}[] = [
  // Goes to the passes, not the waitlist form: "Attend" means buy a ticket now that
  // there is something to buy. The ticket brief calls for exactly this — Attend must
  // land on the pricing slots, and a slot opens the payment gateway.
  { label: 'Attend', desc: 'Book a delegate or founder pass', href: '#tickets' },
  { label: 'Nominate a Startup', desc: 'For the Top 10 shortlist', href: '#tickets' },
  { label: 'Partner with us', desc: 'Sponsor, speak or host a desk', action: 'partner' },
]

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
