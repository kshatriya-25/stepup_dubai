// Tier-2 Rising content (from source_contents). Palette stays STEP green/black for now.
// Speakers + hero video are placeholders until real assets arrive.

export const site = {
  name: 'Tier-2 Rising',
  fullName: 'Tier-2 Rising Startup Summit',
  season: 'Season 1 · 2026',
  initiativeBy: 'An initiative by Namma Office',
  theme: 'Where Tier-2 startups become funding-ready',
  tagline: 'Where Tier-2 startups become funding-ready',
  taglineLong:
    'Tier-2 Rising coaches serious founders to funding-readiness and puts them in front of the investors, banks and government schemes that back them.',
  headline: 'TIER-2 RISING',
  subhead: 'Startup Summit',
  dates: '5 & 6 September 2026',
  datesShort: 'Sat & Sun',
  startISO: '2026-09-05T09:00:00+05:30',
  venue: 'Erode Tex Valley',
  city: 'Erode, Tamil Nadu',
  register: '#register',
  contactEmail: 'hello@tier2rising.in',
}

export type NavItem = { label: string; href: string; children?: { label: string; href: string }[] }

export const nav: NavItem[] = [
  { label: 'The Summit', href: '#story' },
  { label: 'Growth Zones', href: '#zones' },
  { label: 'Programme', href: '#whatgoeson' },
  { label: 'Partners', href: '#partners' },
]

export const participateRoutes = [
  { label: 'Attend', desc: 'Register as a delegate', href: '#register' },
  { label: 'Nominate a Startup', desc: 'Put a founder forward', href: '#register' },
  { label: 'Partner / Sponsor', desc: 'Back the movement', href: '#partners' },
  { label: 'Speak', desc: 'Join the line-up', href: '#speakers' },
]

export const socials = [
  { label: 'LinkedIn', href: '#' },
  { label: 'Instagram', href: '#' },
  { label: 'X', href: '#' },
  { label: 'YouTube', href: '#' },
]
