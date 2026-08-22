// Tier-2 Rising home content — human-story copy (from the v1 build), Navy/Orange brand.

export const story = {
  title: 'Why We Built the Room',
  body:
    'There are founders in Tier 2 cities as good as anyone in Chennai or Bangalore — working just as hard, with an idea just as good. What they don’t have is easy access to a room full of investors, the thing a metro founder barely thinks about. The talent was never the problem. The access was. We’re closing that gap over a single weekend.',
}

export const scores = [
  { n: '10', label: 'startups coached to funding-readiness' },
  { n: '3', label: 'pitch live on the main stage' },
  { n: '5', label: 'initiatives unveiled to keep it going' },
  { n: '2', label: 'days · every door open' },
]

export type Zone = { title: string; sub: string; accent: 'accent' | 'purple' | 'cyan' | 'gold' | 'green' }
export const zones: Zone[] = [
  { title: 'Government Grants', sub: 'Scheme officers who can say yes on the day — not six forms later.', accent: 'accent' },
  { title: 'New-Age Investors', sub: 'Angels, syndicates and micro-VCs actually looking in Tier-2.', accent: 'gold' },
  { title: 'Banking & Credit', sub: 'The bank people who sign off the loan, at a desk you can walk up to.', accent: 'cyan' },
  { title: 'Startup Exhibit', sub: 'The ten startups, up close — see what they’ve actually built.', accent: 'purple' },
  { title: "Deal & Investors' Corner", sub: 'A quieter corner for the conversations that matter.', accent: 'green' },
]

// Programme cards — real free-license imagery + the "climb / the day" copy.
export type WhatCard = { label: string; img: string; desc: string }
export const whatGoesOn: WhatCard[] = [
  {
    label: 'Founder Bootcamp',
    img: '/happens/bootcamp.jpg',
    desc: 'Ten Tier-2 startups coached on the pitch, cap table, data room and the questions investors actually ask.',
  },
  {
    label: 'Diligence & Selection',
    img: '/happens/diligence.jpg',
    desc: 'A panel sits with each startup and picks the three that are ready to take the stage.',
  },
  {
    label: 'The Live Finale',
    img: '/happens/finale.jpg',
    desc: 'Three startups pitch to a room that can say yes. The other seven are recognised on stage too.',
  },
  {
    label: 'Growth Zones, All Day',
    img: '/happens/zones.jpg',
    desc: 'Grants, investors, banking and the deal corner — open all day. Walk up anytime.',
  },
  {
    label: 'Startup Exhibit',
    img: '/happens/exhibit.jpg',
    desc: 'The ten startups up close — see what they’ve actually built, not just a slide.',
  },
  {
    label: 'Every Door Open',
    img: '/happens/entry.jpg',
    desc: 'Investors, scheme officers, bank heads and mentors — under one roof in Erode, no borrowed contact needed.',
  },
]

// Practitioner-heavy stage — archetypes; names announced as they roll out.
export type Speaker = { name: string; role: string }
export const speakers: Speaker[] = [
  { name: 'Angels', role: 'Writing real cheques into Tier-2' },
  { name: 'Micro-VC Leads', role: 'Early-stage & syndicate funds' },
  { name: 'Founders Who Raised', role: 'On what they got wrong the first time' },
  { name: 'Startup Singam Alumni', role: 'Featured founders' },
  { name: 'Kongu Industrialists', role: 'Regional business stalwarts' },
  { name: 'StartupTN & Govt', role: 'Schemes, grants & sanctions' },
  { name: 'Bank Scheme Heads', role: 'The people who approve the loans' },
  { name: 'Announced Soon', role: 'Rolling out' },
]

// Real partner logos + their roles.
// `url` is optional: a partner with one becomes a link to their site, a partner
// without one stays a plain card. Don't invent a URL to fill the gap — a dead or
// guessed link is worse than no link.
export type Partner = { label: string; logo: string; name: string; url?: string }
export const partners: Partner[] = [
  { label: 'Event Founder & Principal Organiser', logo: '/logos/nammaoffice-v3.png', name: 'NammaOffice', url: 'https://nammaoffice.com/' },
  { label: 'Event Co-Founder & Strategic Partner', logo: '/logos/3ios.png', name: '3iOS' },
  { label: 'Pitch & Media Partner', logo: '/logos/startupsingam.png', name: 'Startup Singam', url: 'https://www.startupsingam.com/' },
  // tealorca.com, not the .in the brief originally gave. Both resolve, but .in
  // redirects to /home.php while .com serves the site at its root — verified 200 over
  // https on both. https, not http: an http link hands the visitor a "Not secure"
  // warning on the way to our own technology partner.
  { label: 'Technology Partner', logo: '/logos/tealorca.png', name: 'TealOrca', url: 'https://tealorca.com/' },
]

export type GovPartner = { name: string; logo?: string }
export type GovGroup = { group: string; items: GovPartner[] }
export const govPartners: GovGroup[] = [
  {
    group: 'Government Enablement',
    items: [
      { name: 'StartupTN' },
      { name: 'TANSEED' },
      { name: 'TIIC', logo: '/logos/tiic.png' },
      { name: 'DIC' },
      { name: 'MSME', logo: '/logos/msme.png' },
    ],
  },
  {
    group: 'Banking & Credit',
    items: [
      { name: 'SIDBI', logo: '/logos/sidbi.png' },
      { name: 'MUDRA', logo: '/logos/mudra.png' },
      { name: 'CGTMSE' },
    ],
  },
  {
    group: 'Ecosystem & Community',
    items: [{ name: 'Kongu Business Bodies' }, { name: 'Startup Singam', logo: '/logos/startupsingam.png' }],
  },
]

// Belief lines — rotating statements.
export const statements = [
  { text: 'Great businesses should not be limited by geography.', author: 'The Tier-2 Rising belief' },
  { text: 'The talent was never the problem. The access was.', author: 'Why we built the room' },
  { text: 'Two days. Every door open.', author: '10 & 11 October · Erode' },
  { text: 'Tier-2 is rising.', author: 'Coimbatore · Erode · Salem · Tiruppur · Madurai · Trichy' },
]

/**
 * The Vision / Mission section, between the countdown and the story.
 *
 * Copy is supplied verbatim by the client. Note "programs" — the rest of the site uses
 * British spelling ("Founder Programme"), so this one word is inconsistent on purpose
 * rather than by oversight: it is their wording, and changing supplied copy silently is
 * how a review turns into an argument about what was approved.
 */
export type VisionPillar = {
  /** Orange pill above the statement. */
  tag: string
  /** The statement itself — the largest type in the section. */
  statement: string
  /** Small caps label on the card below. */
  cardLabel: string
  cardBody: string
}

export const visionPillars: VisionPillar[] = [
  {
    tag: 'Vision',
    statement: 'Tier-2 cities as strong startup growth hubs.',
    cardLabel: 'What it is',
    cardBody:
      'An ongoing initiative connecting Tier-2 founders with the funding, mentorship, and networks they need to grow — built through year-round programs, not a one-off event.',
  },
  {
    tag: 'Mission',
    statement: 'Connect founders to investors, banks, mentors & enablers.',
    cardLabel: 'Why now',
    cardBody:
      'Tier-2 cities have talent, ideas and a strong business culture — but startups here still lack equal access to funding, mentors, government schemes, bank support and investor networks.',
  },
]
