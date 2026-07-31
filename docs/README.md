# STEP Dubai → Tier-2 Rising — Website Clone Spec

Reverse-engineered specification for rebuilding **`dubai.stepconference.com`** in a
modern React/Next.js stack, then reskinning it into the **Tier-2 Rising Startup Summit**
site.

> **Source of truth:** `https://dubai.stepconference.com/` (WordPress + GrandConference
> child theme). Captured & analysed 2026-07-28. Raw HTML/CSS/JS/video pulled locally into
> the analysis workspace; all values in these docs come from that captured code, not guesswork.

---

## The plan (two passes)

| Pass | Goal | Content | Palette / font |
|------|------|---------|----------------|
| **Pass 1 — Faithful clone** | Pixel-and-motion-faithful replica of STEP Dubai. Proves the design + animation "engine". | STEP's real copy, speakers, partners, images | Electric green `#00FF00`, indigo `#171333`, **Alexandria** |
| **Pass 2 — Reskin** | Same layout/components/animations, repopulated for our event. | Tier-2 Rising copy, stats, speakers, partners | Navy `#072B5F` + Orange `#F47B20` (see [`07-reskin-map.md`](./07-reskin-map.md)) |

Scope: **full site** (every page/template). Animations: **matched 1:1** with the original.

## Tech stack (decision)

- **Next.js (App Router)** — mostly static generation (SSG). Marketing site, SEO matters,
  1000-startup directory + 85 blog posts benefit from static/ISR rendering.
- **Tailwind CSS** — design tokens map cleanly to a Tailwind theme; utility-first keeps the
  huge WordPress CSS from being ported verbatim.
- **Framer Motion** — for the (modest) scroll/reveal + expand animations, matched to the
  original easings.
- **TypeScript** throughout. Content (speakers, partners, tracks, agenda, startups, posts)
  modelled as typed data (MDX/JSON/CMS) instead of WordPress.
- No jQuery / Bootstrap / Gravity Forms / Complianz — each is replaced by a small React
  equivalent (documented in [`02-components.md`](./02-components.md)).

## Document set

| Doc | Contents |
|-----|----------|
| [`01-design-system.md`](./01-design-system.md) | Colors, Alexandria type scale, spacing, grid, breakpoints, radii, shadows, z-index, clip-paths → Tailwind theme |
| [`02-components.md`](./02-components.md) | Every reusable component: props, structure, exact styles, states |
| [`03-animations.md`](./03-animations.md) | Every animation/interaction with exact triggers + values |
| [`04-pages.md`](./04-pages.md) | Full sitemap + section-by-section composition of each page/template |
| [`05-assets.md`](./05-assets.md) | Fonts, videos, images, logos, icons — inventory + sourcing/replacement |
| [`06-build-plan.md`](./06-build-plan.md) | Next.js architecture, folder structure, data model, milestones |
| [`07-reskin-map.md`](./07-reskin-map.md) | Pass-2 mapping to Tier-2 Rising (tokens + copy + assets) |

## The original at a glance

- **Platform:** WordPress; theme `grandconference` + child `grandconference-childtheme`.
  The 2026 look lives almost entirely in the child theme's `app/css/newdesign.css`
  (overrides) layered on `app/css/styles.css` (base). Plugins: Gravity Forms, Complianz
  (cookies), Yoast SEO, a partners-slider block, a countdown builder, Mailchimp, custom
  Twitter feed.
- **Fonts:** **Alexandria** (Google Fonts, weights 400/500/600/700/900). Legacy Work Sans +
  Poppins are still linked but overridden.
- **JS:** jQuery only. No GSAP/ScrollMagic. Animations are CSS transitions + a handful of
  scroll listeners + the Codrops **og-grid** expanding grid + a Bootstrap carousel.
- **Page flow (home):** Nav → Hero (video bg, CTAs, sticky countdown) → Our Story →
  Scores (4 stats) → Tracks (currently `display:none`) → Partners (3 blocks) → Speakers
  (og-grid) → What Goes On (6 cards) → Testimonials carousel → Footer + newsletter →
  Participate modal + cookie banner.

> ⚠️ **Content/IP note:** These docs describe *structure, layout, tokens and behaviour* and
> paraphrase the original's marketing copy. Verbatim STEP copy, speaker bios, logos and
> photos are placeholders in Pass 1 and are **replaced entirely** in Pass 2. Ship Pass 2 (our
> own brand + content) as the public product; Pass 1 stays an internal fidelity reference.
