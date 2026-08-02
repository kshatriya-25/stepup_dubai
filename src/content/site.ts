// Tier-2 Rising content — human-story copy from the v1 build. Navy/Orange brand.
// Canonical facts: one day (Sun 11 Oct 2026), Fortune City Erode, ticketed.

export const site = {
  name: 'Tier-2 Rising',
  fullName: 'Tier-2 Rising Startup Summit',
  season: 'In association with Startup Singam',
  initiativeBy: 'NammaOffice Presents',
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
  city: 'Erode, Tamil Nadu',
  entry: 'Ticketed · details announced soon',
  register: '#register',
  contactEmail: 'hello@tier2rising.in',
}

export type NavItem = { label: string; href: string; children?: { label: string; href: string }[] }

export const nav: NavItem[] = [
  { label: 'About', href: '#story' },
  { label: 'Programme', href: '#zones' },
  { label: 'Startups', href: '#whatgoeson' },
  { label: 'Partners', href: '#partners' },
]

export const participateRoutes = [
  { label: 'Attend', desc: 'Register for ticket updates', href: '#register' },
  { label: 'Nominate a Startup', desc: 'For the Top 10 shortlist', href: '#register' },
  { label: 'Partner with us', desc: 'Sponsor, speak or host a desk', href: '#partners' },
]

export const socials = [
  { label: 'LinkedIn', href: '#' },
  { label: 'Instagram', href: '#' },
  { label: 'X', href: '#' },
  { label: 'YouTube', href: '#' },
]
