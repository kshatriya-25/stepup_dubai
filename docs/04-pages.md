# 04 — Full Site Map & Per-Page Specs

All pages are one WordPress theme → the same **shell** (nav + footer + cookie banner + participate
modal) wraps every page. Each page is a **composition of the components in [`02`](./02-components.md)**.
This doc lists every route and its section stack. Copy is paraphrased; real text is placeholder
in Pass 1 and replaced in Pass 2.

> **Note on dates in the source:** the live site is mid-transition — the home hero teases
> "3-4 February 2027 · Dubai Internet City" while agenda/track pages still say "11–12 Feb 2026".
> Pass 1 mirrors whatever each page shows; Pass 2 uses our own dates. Don't try to reconcile them.

---

## Route inventory (from `page-sitemap.xml` + nav + `startups`/`blog` sitemaps)

### Primary / templated
| Route | Template | Notes |
|-------|----------|-------|
| `/` | **Home** | the big one — full section stack below |
| `/step-2026-participating-speakers/` | **Speakers** | og-grid, 100+, no filters |
| `/step-agenda-2026/` | **Agenda** | filter tabs + schedule rows |
| `/partners-2026/` | **Partners** | ~22 tier categories |
| `/tracks/` | **Tracks hub** | tiles → track detail |
| `/the-ai-stack-track/` · `/ai-in-finance-track/` · `/human-first-track/` · `/founders-and-funders-track/` · `/adtech-track/` | **Track detail** (1 template ×5) | hero + intro + who-attends + CTAs + testimonials |
| `/step-mentors-2/` | **Mentors** | people grid (og-grid variant) |
| `/step-investors-2/` | **Investors** | people grid |
| `/satellite-events-2026/` | **Content page** | listing/cards |
| `/2026-startup-basecamp/` | **Content page** | programme detail |
| `/startup-activities/` · `/dtc-activities/` | **Content page** | activity listings |
| `/why-dubai/` (+ `/why-dubai-1/`) | **Content page** | value-prop + stats |
| `/dubai-travel/` | **Content page** | travel/hotel/visa info |
| `/exhibitors-marketing-kit/` | **Content page** | downloadable kit |
| `/startups-referral/` | **Form page** | referral form |

### Directory & blog (data-driven)
| Route | Template | Volume |
|-------|----------|--------|
| `/go/startups/` (company directory) | **Directory list** + filter tabs | ~**1000** startup profiles |
| `/startups/<slug>/` | **Startup profile** | 1 per startup |
| `/news/` (blog index) | **Blog list** + sidebar + pagination | — |
| `/<post-slug>/` | **Blog post** | ~**85** posts |
| category / tag archives | **Blog list** variant | — |

### Participate / conversion + utility
| Route | Template |
|-------|----------|
| `/go/exhibit-at-step-2026/`, `/go/startups/`, `/go/2026-promo-code/` | **Landing/redirect** (`/go/*` marketing gateways) |
| Register / ticket (external `ae.sajilni.com` cart) | external link, keep as outbound CTA |
| `/thank-you/`, `/forms-thanks/`, `/startup-thankyou/`, `/startup-approved/`, `/thanks-startups/`, `/ticket-successful/` | **Thank-you** (1 template, variants) |
| `/privacy-policy/` | **Legal** (prose) |
| `/custom-404/` | **404** |

---

## HOME — `/`  (section stack, top → bottom)

1. **Shell nav** (`SiteNav`) — logo + DIC co-brand, dropdown menu (For Exhibitors, For
   Startups, Program, Agenda, News, About Us), Participate + Get Tickets.
2. **Hero** (`Hero`) — video bg; black card: "SEE YOU AT STEP" / theme line / date / venue;
   CTAs: Get Tickets, Exhibit or Sponsor, (+1).
3. **CountdownBar** (`CountdownBar`) — "The Last Chance Saver rate ends in:" → becomes sticky
   bottom bar on scroll.
4. **Our Story** (`features1`) — green `#00FF00` block, **magenta** `h2` "Our Story",
   paragraph (≈13-year history / leading tech festival), optional clip-path image.
5. **Scores** (`Scores`) — black strip: 8000+ / 400+ / 100+ / $9 Billion.
6. **Tracks** (`Tracks`) — present but `display:none` on live home (build, hide via prop).
7. **Partners** (`PartnerRow` ×3) — PRESENTED BY · STRATEGIC PARTNER 2026 · OFFICIAL AIRLINE
   PARTNER (Emirates), each a logo slider; plus "previous partners" & "Super Partner" rows.
8. **Speakers** (`SpeakerGrid`) — green header band "Step Dubai 2026 Speakers", 5-col og-grid
   with expand; "see more speakers" → Speakers page.
9. **What Goes On** (`WhatGoesOn`) — 6 cards: Entertainment, Brand Activations, Exhibition
   Areas, Satellite Events & Meet-ups, Startup Programming, Talks and Workshops.
10. **Testimonials** (`Testimonials`) — indigo radial carousel, mint attributions, 4s autoplay.
11. **Footer** (`SiteFooter`) — logo, contact, newsletter, nav; then green **copyright bar**.
12. **Overlays** — `ParticipateModal` + `CookieBanner` (mounted in the shell, not in flow).

---

## SPEAKERS — `/step-2026-participating-speakers/`

- Shell nav.
- **Page hero** (`.mfont` style): title "Step Dubai 2026 Speakers" + note "More will be
  announced soon!".
- **SpeakerGrid** — same og-grid component as home but the **full roster (100+)**; **no
  filters/tabs**. Click → inline expand bio panel.
- Footer shell.
- **Data:** `speakers[]` (see [`06`](./06-build-plan.md) data model). Home shows first N; this
  page shows all.

## AGENDA — `/step-agenda-2026/`

- Shell nav.
- **Filter bar** (three tab groups, client-side filtering):
  - **Tracks:** All Tracks · Human First · Founders and Funders · The AI Stack · AI In Finance
  - **Session types:** All · Digital Segment by MMS · Pitch · Fireside Chat · Workshop · Panel ·
    Debate · Remarks · Keynote
  - **Days:** All Days · Day 1 · Day 2
- **Schedule rows** (`.schedule-row` / `.company-directory.agenda`): each row = **time slot** ·
  **stage/venue** (Main Stage, Center Stage, AI Stage, Workshop Room) · **track badge** ·
  **session title** (expandable) · **description** (truncated/expand) · **speaker cards**
  (headshot + name + org). Row card style: white, subtle shadow, indigo titles (40px/700).
- Footer shell.
- **Data:** `sessions[]` with `{ day, start, end, stage, track, type, title, desc, speakerIds }`.
  Build `AgendaFilterBar` + `SessionRow`; filtering is pure client state.

## TRACK DETAIL — `/the-ai-stack-track/` (template ×5)

- Shell nav.
- **Track hero/banner** — big banner image + track name (e.g., "THE AI STACK") + date/venue
  line + one-line subtitle.
- **Intro copy block** — overview paragraph of the track's scope.
- **Who Attends** — `h2` "WHO ATTENDS?" + **4 audience cards** (e.g., AI Founders & Engineers,
  Corporates & Enterprises, Academia & Researchers, Platforms & Infra Providers).
- **CTAs** — Get Tickets + Startup Showcase Application.
- **Testimonials** (`Testimonials`) — quotes from ecosystem names.
- **Newsletter** + Footer shell.
- **Data:** `tracks[]` = `{ slug, name, banner, subtitle, intro, audience[4], testimonials[] }`.
  One `TrackPage` template rendered per slug.

## TRACKS HUB — `/tracks/`

- Shell nav → **grid of track tiles** (the `Tracks` component, shown here) → each links to a
  track detail → footer.

## PARTNERS — `/partners-2026/`

- Shell nav.
- **Stacked partner tiers** — ~22 categories, each a green label band + logo grid/slider:
  PRESENTED BY · STRATEGIC PARTNER · MAIN PARTNER · KNOWLEDGE PARTNER · PARTNER · OFFICIAL
  AIRLINE PARTNER · TRAVEL PARTNER · STARTUP BASECAMP SPONSOR · CO-WORKING SPONSOR · INVESTOR
  MEETINGS LOUNGE SPONSOR · MENTOR'S CORNER SPONSOR · EXCLUSIVE AUTOMOTIVE PARTNER · ADVERTISING
  PARTNER · CONNECTIVITY PARTNER · PRINT & MERCHANDISE PARTNER · WELLNESS ACTIVATION PARTNER ·
  OFFICIAL HOTEL PARTNER · OFFICIAL CATERING PARTNER · EXHIBITORS · OFFICIAL TECH & FINANCE
  PUBLICATION PARTNERS · MEDIA PARTNERS 2026 · ECOSYSTEM PARTNERS.
- Testimonials + newsletter + Footer shell.
- **Data:** `partnerCategories[] = { label, logos:[{src,alt,href}] }`. Reuse `PartnerRow`.

## MENTORS / INVESTORS — `/step-mentors-2/`, `/step-investors-2/`

- Shell nav → page hero → **people og-grid** (same component as speakers, different dataset) →
  footer. `people[]` with role/org.

## CONTENT PAGES — why-dubai, dubai-travel, satellite-events, startup-basecamp, startup-activities, dtc-activities, exhibitors-marketing-kit

Generic **content template**: shell nav → page hero (`.mfont`) → a stack of prose blocks +
image/stat/card sections (reuse `features1/2/3`, `Scores`, `WhatGoesOn`, `get-in-touch` band) →
newsletter → footer. Each is authored content; model as MDX pages. `why-dubai` leans on stats;
`dubai-travel` is info-heavy (hotels/visa); `satellite-events` is a card list; `startup-basecamp`
is programme detail with CTAs.

## STARTUP DIRECTORY — `/go/startups/` + `/startups/<slug>/`

- **List:** shell nav → hero → **filter tabs** (`.ticketsfilter`/`.partnersfilter`-style category
  filter, client-side show/hide) → **directory rows** (`.schedule-row`: logo `≤150px` +
  company title (40px/700 indigo) + description + category/location meta, subtle shadow) →
  pagination → footer. ~1000 entries → **paginate/virtualize**; SSG + ISR or on-demand.
- **Profile:** `/startups/<slug>/` → logo, name, description, links, category. One template.
- **Data:** `startups[] = { slug, name, logo, category, blurb, links }`. Heaviest dataset —
  see [`06`](./06-build-plan.md) for the SSG/ISR strategy.

## BLOG / NEWS — index + post (`~85`)

- **Index** (`section.blog`): shell nav → page hero (`.mfont` "News") → **card list**
  (`.main_blog_box`: shadow card, image, `h1` title 40px, excerpt, mint `.btn-primary` "read
  more") in a main column + **sidebar** (`.sidebar_widget`: recent posts, tag cloud with mint
  chips) → **pagination** (`.footer-page-navigation`, indigo numbers, mint active/hover) → footer.
- **Post** (`.blog`): title `h1` 40px, meta (`.post_attribute`, faint), prose (18px/25
  `#1B1F21`), images; sidebar; related. Model as MDX; `getStaticPaths` over 85 slugs.

## PARTICIPATE / GO / THANK-YOU / LEGAL / 404

- **`/go/*` gateways** — focused landing pages (single hero + form/CTA) that funnel to exhibit /
  startup / promo flows; mostly a hero + `RegisterForm` + trust logos.
- **Thank-you** (`/thank-you`, `/forms-thanks`, `/startup-thankyou`, `/startup-approved`,
  `/thanks-startups`, `/ticket-successful`) — one template: centered confirmation message +
  next-step CTA + footer. Route users here after form submit.
- **Register / tickets** — original opens external `ae.sajilni.com` cart in a new tab. Keep as
  an **outbound CTA** (don't rebuild the checkout). Pass 2 swaps to our ticketing URL.
- **`/privacy-policy/`** — legal prose template.
- **`/custom-404/`** — branded 404 (green, big type, back-home CTA) → Next.js `not-found.tsx`.

---

## Page-template summary (what to actually build)

Distinct templates to implement = **12**:
`Home`, `Speakers`, `Agenda`, `TrackHub`, `TrackDetail`, `Partners`, `PeopleGrid`
(mentors/investors), `ContentPage` (MDX), `DirectoryList`, `StartupProfile`, `BlogList`,
`BlogPost`, plus small ones: `ThankYou`, `Legal`, `NotFound`, `GoLanding`. Everything else is
data feeding these templates.
