# 07 — Pass 2: Tier-2 Rising Reskin Map

Pass 1 gives us STEP Dubai's layout + motion as a component engine reading tokens + typed
content. Pass 2 = **swap tokens, swap content, swap assets** — no structural changes. This doc is
the swap sheet, sourced from `source_contents/` (Design Brief, Poster PDF, Prospectus PPTX,
Collaboration Agreement).

> Reminder: ship **Pass 2** as the public product. Pass 1 (STEP content) stays an internal
> fidelity reference and is never published.

---

## 1. Token swap (`theme/tokens.ts`)

STEP's model = **one dark base + one loud accent + a few pops**. Tier-2 keeps that structure,
repainted with the brand palette from the Design Brief.

| Role (STEP) | STEP hex | → Tier-2 role | Tier-2 hex |
|-------------|----------|---------------|-----------|
| Dark base (nav, hero card, scores) | `#000` / `#171333` | **Deep Navy** (trust, enterprise) | `#072B5F` |
| Primary accent (flat blocks, buttons) | `#00FF00` | **Rising Orange** (energy, growth) | `#F47B20` |
| Page bg | `#fff` | Clean White | `#FFFFFF` |
| "Our Story" heading pop | `#E93CF7` magenta | **Startup Purple** (or Orange) | `#6B3FA0` |
| Secondary accent (quotes, blog) | `#73ECCF` mint | **Growth Green** (funding) | `#16A05D` |
| Gradient start (get-in-touch) | `#1DE6C7` teal | **Tech Cyan** (AI/innovation) | `#00AEEF` |
| Gradient end | `#7488AA` slate | Deep Navy | `#072B5F` |
| Recognition / investment highlights | — | **Investor Gold** | `#F2B705` |
| Footer warm bg | `#F9F7F1` | keep or Navy `#072B5F` @ tint | `#F5F7FA` |

**Zone color-coding** (Design Brief §8) maps straight onto track tiles / zone cards:
Marketing = Orange · CRM & Sales = Blue/Navy · ERP & Ops = Slate/Dark Navy · AI & Tech =
Cyan/Purple · Investment = Gold/Green · Startup Exhibit = White+Navy+Orange.

**Contrast check:** Rising Orange `#F47B20` on white passes for large text/UI but **not** small
body — use Navy for body text, Orange for headings/CTAs/blocks. Gold `#F2B705` needs dark text.
Run every pairing through the a11y validator before locking.

## 2. Typography

- STEP's **Alexandria** is a rounded geometric sans that fits the Design Brief's "modern, clean,
  strong hierarchy" — **keep Alexandria**, or switch to a bolder geometric (Sora / Manrope /
  Poppins) if we want more "enterprise summit" gravity. Recommendation: **keep Alexandria** for
  Pass 1 fidelity, evaluate a swap in Pass 2 QA. Same weight scale (400/500/600/700/900).
- Keep the square-corner, uppercase-heading, tight-tracking treatment — it reads as "movement /
  festival with credibility", which matches the brief's "bold, aspirational, professional".

## 3. Event facts (single source — from the Poster, the newest asset)

| Field | Value |
|-------|-------|
| Name | **Tier-2 Rising Startup Summit** (Season 1) |
| Tagline | **Where Tier-2 Startups Become Funding-Ready** |
| Dates | **5 & 6 September 2026** (Sat & Sun) |
| Venue | **Erode Tex Valley, Erode, Tamil Nadu** |
| Format | Day 1 — Bootcamp & Selection · Day 2 — Conclave Day |
| Organised by | **Namma Office** |
| Pitch & Media Partner | **Startup Singam** |
| Event Collaborator | **BIOS** |
| Technology Partner | **TealOrca** (us) |

> Poster vs. Prospectus discrepancies (venue Erode vs. Coimbatore; dates Sep vs. Aug; Day 1/2 vs.
> Day 0/1; collaborator BIOS vs. Curd Rice): **the Poster wins** — it's the finished, latest
> artifact. Confirm with the client before build if any of these are still in flux.

## 4. Section content swap (Home)

| Component | STEP content | → Tier-2 Rising content |
|-----------|--------------|------------------------|
| **Hero** title/theme/date/venue/CTAs | "SEE YOU AT STEP" / AI Economy / 3-4 Feb 2027 / Dubai IC / Get Tickets·Exhibit·… | "TIER-2 RISING STARTUP SUMMIT" / "Where Tier-2 Startups Become Funding-Ready" / 5–6 Sep 2026 / Erode Tex Valley / **Register · Nominate a Startup · Sponsor** |
| **CountdownBar** | rate deadline | countdown to 5 Sep 2026 (Asia/Kolkata) → Register CTA |
| **Our Story** | STEP 13-yr history | Campaign context: "Tier-2 Rising" — great businesses shouldn't be limited by geography; from idea to funding-ready |
| **Scores** (4 stats) | 8000+/400+/100+/$9B | **10** startups coached · **3** pitch finalists · **5** initiatives unveiled · **plus** the gap stat (87% people / 68% economy / 10–15% funding) as a callout band |
| **Tracks/Zones** (tiles) | 5 STEP tracks | The **5 all-day zones**: Government Grants · New-Age Investors · Banking & Credit · Startup Exhibit · Deal Corner (color-coded per §1) |
| **Partners** (3+ rows) | STEP partners | PRESENTED BY: Namma Office · PITCH & MEDIA: Startup Singam · EVENT COLLABORATOR: BIOS · TECHNOLOGY PARTNER: TealOrca · GOVERNMENT (StartupTN/TIIC/DIC/MSME-DI) · BANKING (SIDBI/MUDRA/CGTMSE) · COMMUNITY (Kongu bodies) |
| **Speakers** (og-grid) | STEP speakers | Curated practitioners: new-age angels, micro-VC/syndicate leads, founders who raised in Tier-2, Startup Singam alumni, Kongu industrialists, StartupTN/govt, SIDBI scheme heads |
| **What Goes On** (6 cards) | Entertainment/Activations/… | The **5 key initiatives**: Back To Roots · iShoot Room · Ignite Incubation Centre · Enterprise Sandbox · Tier-2 Angel Network (+ Startup Exhibit) |
| **Testimonials** | STEP quotes | Ecosystem/Kongu leader quotes (collect) |
| **Footer** | STEP contact/newsletter | Tier-2 Rising organising committee contact + newsletter |

## 5. Page-by-page swap

| Page | Tier-2 Rising content source |
|------|------------------------------|
| **Agenda** | Prospectus run-of-show. Day tabs: **Day 1 Bootcamp & Selection** (bootcamp → due-diligence desks → closed investor pitch → refine/re-pitch → Top 3) · **Day 2 Conclave** (inaugural, keynotes, unveilings, Investor–Startup connects, workshops, **Pitch Finale**, awards). Stages: Main Hall / Pitch Arena / Zones. |
| **Tracks → Zones** | 5 zones (above), each a detail page: who-attends, stalls list (e.g. Govt: StartupTN/TANSEED/TIIC/DIC/MSME-DI; Banking: SIDBI/MUDRA/CGTMSE), CTAs. |
| **Partners** | Full tier list mapped to Namma Office / Startup Singam / BIOS / TealOrca / govt / banks / Kongu community / media. |
| **Mentors/Investors** | "Kongu mentor for every startup"; new-age investor syndicate (Tier-2 Angel Network). |
| **Why-Dubai** → **Why Tier-2 / Why Erode** | The opportunity stat + Kongu region strength. |
| **Startup directory** | The 10 curated startups (Pass-1's 1000 → a small vetted set for S1; template still supports scale). |
| **Blog/News** | Tier-2 Rising updates. |
| **Participate modal** | Attend · **Nominate a Startup** · Partner/Sponsor · Sign up. |
| **Ticketing** | swap external sajilni URL → our registration URL. |

## 6. Asset swap

Per [`05 §5`](./05-assets.md): logos (Namma Office, Tier-2 Rising, Startup Singam, BIOS, TealOrca,
StartupTN/SIDBI/TIIC etc.), zone icons, speaker/partner images, hero video → Tier-2 sizzle (or
poster-only), favicon + OG → Tier-2 brand. Use the Poster PDF as the visual north star for the
hero and color application.

## 7. Reskin execution order

1. Edit `theme/tokens.ts` (colors) + confirm font → whole site repaints (components read tokens).
2. Replace `content/*` (speakers, tracks→zones, partners, agenda, scores, testimonials, pages).
3. Replace `/public` assets + `MANIFEST`.
4. Swap external URLs (ticketing, socials) + event date in countdown.
5. A11y + contrast pass (Orange/Gold pairings), OG/meta, sitemap, redirects for renamed routes.
6. Client review against Poster + Prospectus.

Because Pass 1 was built token-driven and content-driven, Pass 2 should touch **almost no
component code** — that's the whole point of the two-pass plan.
