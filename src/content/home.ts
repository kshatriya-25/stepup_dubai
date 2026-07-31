// Tier-2 Rising home content — minimal & crisp (from source_contents). Green/black palette kept.

export const story = {
  title: 'Our Vision',
  body:
    'To make Tier-2 cities strong startup growth hubs — with equal access to funding, mentorship, market opportunities and ecosystem support. Great businesses should not be limited by geography.',
}

export const scores = [
  { n: '10', label: 'Startups Coached' },
  { n: '3', label: 'Pitch Finalists' },
  { n: '5', label: 'Initiatives Unveiled' },
  { n: '2', label: 'Days · Erode' },
]

export type Zone = { title: string; sub: string; accent: 'accent' | 'purple' | 'cyan' | 'gold' | 'green' }
export const zones: Zone[] = [
  { title: 'Government Grants', sub: 'StartupTN · TANSEED · TIIC · DIC', accent: 'accent' },
  { title: 'New-Age Investors', sub: 'Angels · Micro-VCs · Family Offices', accent: 'gold' },
  { title: 'Banking & Credit', sub: 'SIDBI · MUDRA · CGTMSE', accent: 'cyan' },
  { title: 'Startup Exhibit', sub: 'The 10 startups, live demos', accent: 'purple' },
  { title: "Deal & Investors' Corner", sub: 'Term-sheet exploration', accent: 'green' },
]

// Programme cards — free-license imagery + short copy from the source deck.
export type WhatCard = { label: string; img: string; desc: string }
export const whatGoesOn: WhatCard[] = [
  {
    label: 'Founder Bootcamp',
    img: '/happens/bootcamp.jpg',
    desc: 'Pitch craft, cap table, data room and metrics — the 10 startups coached by mentors and Startup Singam.',
  },
  {
    label: 'Due-Diligence Desks',
    img: '/happens/diligence.jpg',
    desc: 'One desk per founder — documents reviewed and scrutinised ahead of the closed investor pitch.',
  },
  {
    label: 'The Pitch Finale',
    img: '/happens/finale.jpg',
    desc: 'The Top 3 finalists pitch live before the full house — judges, live investor pledges and awards.',
  },
  {
    label: 'Startup Exhibit',
    img: '/happens/exhibit.jpg',
    desc: 'The shortlisted startups showcase their stalls and run live product demos through the day.',
  },
  {
    label: 'Growth Zones',
    img: '/happens/zones.jpg',
    desc: 'Government grants, new-age investors, banking, credit and the deal corner — open all day.',
  },
  {
    label: 'Open, Free Entry',
    img: '/happens/entry.jpg',
    desc: 'Free entry for all — startups, investors and the public. Register to attend.',
  },
]

// Placeholder roster — real speakers announced later.
export type Speaker = { name: string; role: string }
export const speakers: Speaker[] = Array.from({ length: 10 }, (_, i) => ({
  name: 'Announced Soon',
  role: ['Angel Investor', 'Micro-VC', 'Founder', 'Govt / Bank'][i % 4],
}))

// Real partner logos (provided).
export type Partner = { label: string; logo: string; name: string }
export const partners: Partner[] = [
  { label: 'Organised By', logo: '/logos/nammaoffice.png', name: 'Namma Office' },
  { label: 'Pitch & Media Partner', logo: '/logos/startupsingam.png', name: 'Startup Singam' },
  { label: 'Event Collaborator', logo: '/logos/3ios.png', name: '3iOS' },
  { label: 'Technology Partner', logo: '/logos/tealorca.png', name: 'TealOrca' },
]

// Government / banking / ecosystem partners. Drop an official logo file at `logo` to
// render the real mark; until then a clean typographic badge shows.
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

// Rotating statement lines (short-copy from the brief).
export const statements = [
  { text: 'Ideas from Tier-2. Opportunities for the World.', author: 'Tier-2 Rising' },
  { text: 'From local startups to investment-ready businesses.', author: 'The journey' },
  { text: 'Tier-2 is not waiting anymore. Tier-2 is rising.', author: 'Core belief' },
]
