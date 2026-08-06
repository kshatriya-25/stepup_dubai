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

// The Apps Script /exec URL is no longer read here — the browser posts to
// /api/register, and that route reads NEXT_PUBLIC_REGISTRATION_ENDPOINT server-side.
// See REGISTRATION-SETUP.md and EMAIL-SETUP.md.

// Registration toggle: '1' shows the live form, '0' (or unset) shows an "opening soon" state.
export const registrationOpen = process.env.NEXT_PUBLIC_REGISTRATION_OPEN === '1'

export const registrationRoles = [
  'Founder',
  'Investor',
  'Government / Bank',
  'Ecosystem / Mentor',
  'Media',
  'Other',
] as const

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
