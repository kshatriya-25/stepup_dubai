# 06 — Build Plan (Next.js Architecture)

How we turn the specs into a running app, and the order we do it in.

---

## 1. Stack & rationale

| Choice | Why |
|--------|-----|
| **Next.js 15 (App Router)** | SSG/ISR for a marketing site + 1000-startup directory + 85 posts; great SEO; file-based routing maps 1:1 to the sitemap. |
| **TypeScript** | typed content models (speakers, tracks, agenda, partners, startups, posts). |
| **Tailwind CSS** | design tokens ([`01`](./01-design-system.md)) become the theme; no need to port 400KB of WP CSS. |
| **Framer Motion** | the few animations ([`03`](./03-animations.md)) — expand panels, fades. |
| **embla-carousel** | partner slider + testimonials. |
| **lucide-react** | icons (replaces Font Awesome). |
| **MDX + typed JSON** | content pages + blog (MDX); data-driven collections (JSON/TS). Upgrade path: swap the data layer for a headless CMS (Sanity/Payload) without touching components. |
| **next/font**, **next/image** | fonts + image optimisation. |

No jQuery, Bootstrap, Gravity Forms, or the WP plugin zoo.

## 2. Folder structure

```
src/
  app/
    layout.tsx                # <Shell>: SiteNav + children + SiteFooter + ParticipateModal + CookieBanner
    page.tsx                  # Home
    (marketing)/
      step-2026-participating-speakers/page.tsx   # Speakers
      step-agenda-2026/page.tsx                    # Agenda
      partners-2026/page.tsx                       # Partners
      tracks/page.tsx                              # Track hub
      [track]/page.tsx        # Track detail (generateStaticParams over 5 slugs)
      step-mentors-2/page.tsx · step-investors-2/page.tsx
      why-dubai/ dubai-travel/ satellite-events-2026/ 2026-startup-basecamp/ … # ContentPage (MDX)
    go/
      startups/page.tsx       # Directory list
      exhibit-at-step-2026/page.tsx  … # /go/* landings
    startups/[slug]/page.tsx  # Startup profile (generateStaticParams, ISR)
    news/page.tsx             # Blog list
    news/[slug]/page.tsx      # Blog post (MDX)
    thank-you/ forms-thanks/ … # ThankYou variants
    privacy-policy/page.tsx
    not-found.tsx             # 404
  components/
    primitives/  { Container, Button, SectionHeading, Reveal, Expander }
    shell/       { SiteNav, SiteFooter, ParticipateModal, CookieBanner }
    home/        { Hero, CountdownBar, Scores, Tracks, PartnerRow, SpeakerGrid, WhatGoesOn, Testimonials }
    agenda/      { AgendaFilterBar, SessionRow }
    directory/   { DirectoryFilter, DirectoryRow, Pagination }
    blog/        { PostCard, BlogSidebar, Pagination }
  content/
    speakers.ts  tracks.ts  agenda.ts  partners.ts  testimonials.ts  scores.ts  whatgoeson.ts
    startups/*.json (or one big json)   posts/*.mdx   pages/*.mdx
  lib/           { hooks: useScrollDirection, useStickyBottom, useCountdown; consent; mdx }
  styles/        globals.css (tokens as CSS vars + Tailwind)
  theme/         tokens.ts (single source → tailwind.config + CSS vars)
```

## 3. Data models (TypeScript)

```ts
type Speaker  = { id:string; name:string; org:string; role?:string; img:string; bio:string; socials?:Social[]; featured?:boolean }
type Track    = { slug:string; name:string; banner:string; subtitle:string; intro:string; audience:{title:string;desc:string}[]; testimonials:Quote[] }
type Session  = { id:string; day:1|2; start:string; end:string; stage:string; track:string; type:string; title:string; desc:string; speakerIds:string[] }
type PartnerCategory = { label:string; logos:{src:string;alt:string;href?:string}[] }
type Startup  = { slug:string; name:string; logo:string; category:string; blurb:string; links?:Link[] }
type Post     = { slug:string; title:string; date:string; excerpt:string; cover:string; tags:string[]; body:MDX }
type Quote    = { text:string; author:string; org?:string }
type Score    = { n:string; label:string }
```
Single source of truth in `content/`. Home reads `featured` slices; index pages read the full set.

## 4. The shell (`app/layout.tsx`)

Wraps every route: `SiteNav` (client, scroll hooks) + `main` + `SiteFooter` + `ParticipateModal`
(context-controlled) + `CookieBanner`. Fonts via `next/font` on `<html>`; tokens as CSS vars in
`globals.css`. A `<ParticipateProvider>` exposes `open()` to any Participate trigger.

## 5. Rendering strategy

| Page | Strategy |
|------|----------|
| Home, speakers, agenda, partners, tracks, content pages | **SSG** (static) |
| Track detail | SSG via `generateStaticParams` (5) |
| Blog list/post | SSG (85) + ISR (revalidate for new posts) |
| Startup directory + profiles | **ISR** (1000): statically generate top/most-viewed, ISR/on-demand for the long tail; list is paginated (`/go/startups?page=n`) + client filter |
| Thank-you / legal / 404 | static |
| Ticket checkout | external link (sajilni) — outbound only |

## 6. Responsive & tokens plumbing

- `theme/tokens.ts` exports colors/space/type → consumed by `tailwind.config.ts` **and** emitted
  as CSS custom properties in `globals.css`. One edit point for Pass 2.
- Breakpoints per [`01 §3.1`](./01-design-system.md): `xs320 / sm768 / md990 / lg1200 / xl1600`.
  Original uses `max-width` queries; use Tailwind `max-md:` variants where it mirrors the source.
- `prefers-reduced-motion` respected in the motion primitives.

## 7. Milestones

- **M0 — Setup:** Next+TS+Tailwind+tokens+fonts; `Container/Button/SectionHeading`; deploy skeleton.
- **M1 — Shell:** `SiteNav` (scroll behaviour), `SiteFooter`, `ParticipateModal`, `CookieBanner`.
- **M2 — Home:** Hero+video, CountdownBar (sticky), Our Story, Scores, PartnerRow, WhatGoesOn,
  Testimonials → **home pixel-matches** the original.
- **M3 — SpeakerGrid:** og-grid + inline expander (home slice + full Speakers page).
- **M4 — Tracks + Agenda:** Track hub/detail template ×5; Agenda filter bar + rows.
- **M5 — Partners + People:** Partners tiers; Mentors/Investors grids.
- **M6 — Content + Blog:** MDX ContentPage template; blog list/post + sidebar + pagination.
- **M7 — Directory:** 1000-startup list (filter + pagination + ISR) + profile template.
- **M8 — Conversion:** forms, /go landings, thank-you routes, privacy, 404; consent-gated analytics.
- **M9 — QA:** cross-browser, Lighthouse (LCP/CLS), a11y, reduced-motion, responsive sweep vs. original.
- **M10 — Pass 2 reskin:** apply [`07-reskin-map.md`](./07-reskin-map.md) — tokens + content + assets.

Home (M0–M2) is the first sign-off gate; the rest reuses the same components.

## 8. Fidelity QA checklist (Pass 1)

- [ ] Nav: black, colors@40px, hides@scroll-down>500px, shows on up.
- [ ] Hero: video cover, black card left / green card mobile, exact type sizes, 3 CTAs.
- [ ] Countdown: live ticking, sticks to bottom on scroll, hides near footer, fadein.
- [ ] Our Story: `#00FF00` bg + `#E93CF7` heading + clip-path image at each breakpoint.
- [ ] Scores: 4 stats, black bg, stacks w/ dividers ≤988.
- [ ] Partners: 3 rows, auto-slider, green labels.
- [ ] Speakers: 5-col grid, gradient+name overlay, click → inline expand, one open at a time.
- [ ] What Goes On: 6 cards + green buttons.
- [ ] Testimonials: radial-indigo bg, mint attributions, 4s autoplay, dot indicators.
- [ ] Footer: `#F9F7F1`, newsletter, green copyright bar.
- [ ] All buttons square, uppercase, correct hover inversions.
- [ ] Breakpoints 1600/1200/990/768/640 behave as source.
- [ ] Lighthouse ≥ 90 perf/SEO/a11y.
