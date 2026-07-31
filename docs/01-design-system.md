# 01 — Design System

Everything in this doc is extracted from the captured `styles.css` + `newdesign.css`
(load order: `styles.css` **then** `newdesign.css`, so `newdesign.css` wins the cascade).

---

## 1. Color

### 1.1 The CSS-variable cascade (important)

Two `:root` blocks define the same variables. `newdesign.css` loads last, so **its values win**:

```css
/* styles.css (loaded first) */
:root { --green:#00FF00; --red:#DA3231; --text:#000; }

/* newdesign.css (loaded last — WINS) */
:root { --green:#00FF00; --red:#00FF00; --text:#000000; }
```

**Net effect on the live site:** `var(--green)` and `var(--red)` both resolve to **`#00FF00`
(electric green)**. So the many places that reference `--red` (mobile menu buttons, form
hovers, "what goes on" hover, footer accents) actually render the same electric green — the
site has essentially **one loud accent**, not a red one. Treat `--red` as a legacy alias of
green; do **not** ship a real red.

### 1.2 Palette (as rendered)

| Token | Hex | Role / where |
|-------|-----|--------------|
| `green` (primary accent) | `#00FF00` | The signature. Flat blocks: "Our Story" bg, buttons, nav dropdown items, speaker header band, footer buttons, form submits, footer-copyright bar, "Get Tickets" |
| `ink` / black | `#000000` | Nav bar, hero card bg, scores bg, speaker gradient, primary text |
| `indigo` | `#171333` | Countdown numbers, sticky countdown button, blog/agenda headings, "get in touch" button, radial-gradient quotes bg |
| `indigo-2` | `#1B1754` / `#171233` | Quotes radial gradient stops (`radial-gradient(50% 50% at 50% 50%, #1B1754, #171233)`) |
| `white` | `#FFFFFF` | Page bg, hero text, section text on dark |
| `mint` | `#73ECCF` | Secondary accent: testimonial quote text, blog buttons, tag borders, pagination active |
| `teal` | `#1DE6C7` | "Get in touch" gradient start |
| `slate` | `#7488AA` | "Get in touch" gradient end |
| `magenta` | `#E93CF7` | **"Our Story" (features1) `<h2>` only** — a one-off pop against the green |
| `blue` | `#2A53A2` | Legacy track overlay tint (mostly commented out now) |
| `foam` | `rgba(249,247,241,1)` `#F9F7F1` | Footer background (warm off-white) |
| track green | `#27FE00` | Track tile backgrounds (near-identical to `#00FF00`) |

Utility tints seen in code: modal backdrop `#00ff0057` (green @ ~34% alpha), hairlines
`rgba(255,255,255,0.2–0.3)`, image gradient `linear-gradient(to bottom, transparent, #000)`
at `opacity:0.8`.

### 1.3 Gradients

- **Quotes/testimonial bg:** `radial-gradient(50% 50% at 50% 50%, #1B1754 0%, #171233 100%)`
- **Get-in-touch band:** `linear-gradient(to right, #1DE6C7 0%, #7488AA 100%)`
- **Speaker card overlay:** `linear-gradient(to bottom, transparent, #000)` @ `opacity:0.8`

### 1.4 Tailwind theme (Pass 1)

```js
// tailwind.config.ts — theme.extend.colors
colors: {
  green:  '#00FF00',   // primary accent (alias: accent)
  ink:    '#000000',
  indigo: { DEFAULT:'#171333', 900:'#171233', 800:'#1B1754' },
  mint:   '#73ECCF',
  teal:   '#1DE6C7',
  slate2: '#7488AA',
  magenta:'#E93CF7',
  blue2:  '#2A53A2',
  foam:   '#F9F7F1',
}
```

> In Pass 2 only this block + the font change; every component reads tokens, never raw hex.

---

## 2. Typography

### 2.1 Family

**Alexandria** everywhere (a rounded geometric sans; Google Fonts). Loaded on the original via
`@import url("https://fonts.googleapis.com/css?family=Alexandria:400,400i,500,600,700,700i,900")`.
In Next.js use `next/font/google`:

```ts
import { Alexandria } from 'next/font/google'
export const alexandria = Alexandria({
  subsets: ['latin'],
  weight: ['400','500','600','700','900'],
  variable: '--font-alexandria',
})
```

Weights used: 400 (body/nav), 450–500 (hero sub, labels), 600 (hero theme line), 700/bold
(headings, numbers, buttons), 900 (available, used sparingly).

### 2.2 Type scale (desktop → mobile)

Values are the literal `font-size / line-height` from the CSS.

| Role | Desktop | Mobile (≤768) | Weight | Notes |
|------|---------|---------------|--------|-------|
| Hero title `h1.hero-title` | 45px / 1.1 | 40px / 40 | 700 | uppercase, `word-spacing:-4px` |
| Hero theme line | 14.5px / 1.1 | — | 650 | uppercase, `letter-spacing:.5px` |
| Hero sub (date/venue) | 22px / 0.5 | — | 450 | uppercase; venue `margin-top:-20px` |
| Section `h2` (Our Story, What Goes On, Speakers, Partners) | 48–50px / 50 | 34–42px / 34–42 | 700 | uppercase (most) |
| "Our Story" `h2` | 48px / 60 | 34 | 700 | color **magenta** `#E93CF7` |
| Scores number `h2` | ~inherits large | — | 700 | white on black |
| Scores label `p` | 18px / 30 | 18px | 400 | white, on black |
| Countdown number `#demo .number` | 42px / 42 | 28px / 28 | 700 | color indigo |
| Countdown label `.name` | 9px / 11 | 7px | 500 | indigo @ `opacity:.5` |
| Countdown message | 22px / 22 | 10px | 700 | black |
| Speaker name `p.title` | 24px / 28 | 25px | 700 | white, bottom-left over image |
| Speaker role `span` | 16px | — | — | indigo `#171333` |
| Body `p` (features/blog) | 18px / 24–25 | 14px / 20 | 400 | `#000` / blog `#1B1F21` |
| Buttons `.btn / .action-buttons-mod` | 16–22px / 22 | 16px | 400–700 | uppercase |
| `.btn-md-2` (see-more) | 24px / 22 | — | 700 | green bg |
| Testimonial quote `p` | 30px / 30 | — | 700 | mint `#73ECCF` |
| Testimonial attribution `h2` | 20px / 25 | 18px | 500 | white |
| Footer newsletter title | 16px / 29 | — | 700 | uppercase, green |
| Footer copyright | 16px / 14 | 14px | 700 | uppercase, black on green |
| Blog `h1` | 40px / 40 | 30px | 700 | |
| Page hero `.mfont` | 48px | 40px | 700 | uppercase, white |
| Company/agenda title | 40px / 40 | — | 700 | indigo |

### 2.3 Tailwind fontSize tokens

```js
fontSize: {
  'hero':      ['45px', { lineHeight:'1.1', fontWeight:'700' }],
  'hero-sub':  ['22px', { lineHeight:'1', fontWeight:'450' }],
  'section':   ['50px', { lineHeight:'50px', fontWeight:'700' }],
  'section-sm':['34px', { lineHeight:'34px', fontWeight:'700' }], // mobile
  'count':     ['42px', { lineHeight:'42px', fontWeight:'700' }],
  'quote':     ['30px', { lineHeight:'30px', fontWeight:'700' }],
  'body':      ['18px', { lineHeight:'25px' }],
  'btn':       ['22px', { lineHeight:'22px', fontWeight:'700' }],
  'label':     ['16px', { lineHeight:'22px' }],
}
```

---

## 3. Layout, grid & spacing

- **Container:** `.centered1200` = max-width **1200px** (footer uses **1300px**; several 2026
  sections override to `max-width:100%` full-bleed). Bootstrap `.container` + 12-col `.row` /
  `.col-md-*` underneath.
- **Section rhythm:** big sections pad ~`35–50px` vertical on their headings; hero card
  `margin:120px 0 50px 50px` desktop, `padding:90px 15px 50px` mobile.
- **Gutters:** Bootstrap default 15px; speaker grid uses `grid-column-gap:5px; grid-row-gap:15px`.
- **Spacing scale to adopt (Tailwind default 4px step is fine).** Frequently-seen values:
  `5, 8, 10, 12, 15, 20, 25, 30, 35, 40, 50, 65, 85, 90, 120px`.

### 3.1 Breakpoints (match these exactly)

The original mixes several. Normalise to:

| Name | max-width | Used for |
|------|-----------|----------|
| `xl` | 1600px | feature clip-path variants |
| `lg` | 1200px | container / clip-path |
| `md` | 990px (and 988) | **nav switches desktop→mobile**, features stack, partners width |
| `sm` | 799 / 798 / 768px | hero video heights, scores stack, type shrink |
| `xs` | 640 / 320px | button widths, countdown compaction |

> Tailwind: set `screens: { xs:'320px', sm:'768px', md:'990px', lg:'1200px', xl:'1600px' }`
> and treat the original's `max-width` queries as `max-*` variants (design mobile-first, or
> use `@media (max-width)` via a small plugin — see build plan).

---

## 4. Radii, borders, shadows, effects

- **Border-radius:** essentially **0** everywhere (buttons explicitly `border-radius:0`). Sharp,
  boxy, festival look. Only the mobile hamburger bars use `border-radius:3px`. Keep corners square.
- **Borders:** 1px solid dividers — white `#fff` / `rgba(255,255,255,.2)` on dark; `#000` under
  forms; `2px solid #73ECCF` on tag-cloud chips; nav dropdown separators.
- **Shadows:**
  - Sticky countdown: `box-shadow:0 3px 9px rgba(0,0,0,.5)`
  - Blog card: `0 0 1px rgba(0,0,0,.04), 0 2px 6px rgba(0,0,0,.04), 0 10px 20px rgba(0,0,0,.04)`
  - Directory row: `0 0 1px rgba(23,19,51,.04), 0 2px 6px rgba(23,19,51,.04), 0 16px 24px rgba(23,19,51,.08)`
- **Clip-paths (skewed feature images)** — the one distinctive geometric flourish:
  ```css
  .features1 img { clip-path: polygon(0 0, 86.2% 0, 100% 100%, 75% 100%, 0 100%); } /* ≥1200 */
  .features2 img { clip-path: polygon(11.5% 0, 100% 0, 100% 100%, 75% 100%, 0 100%); }
  /* ≤990 both flatten toward polygon(0 0,100% 0,100% 85%,0 100%,0 100%) */
  ```
  The `%` values shift per breakpoint (1600/1200/990) — table in [`03-animations.md`](./03-animations.md#clip).

---

## 5. z-index ladder

| Layer | z-index |
|-------|---------|
| Base content | auto |
| `.what-you-get` cards / action buttons | 999–9999 |
| Colored mobile nav | 999999 |
| Sticky countdown | 9999 |
| Modals / participate menu | above nav (fixed, full-screen) |

Normalise to a small scale: `base 0`, `raised 10`, `nav 50`, `sticky 60`, `modal 100`.

---

## 6. Icons

- **Font Awesome 4.7** (bars/times for hamburger, chevrons, map-pin `event-place-icon`, social).
  Replace with `lucide-react` (Menu, X, ChevronDown, MapPin, socials) or inline SVG.
- Inline **SVG shapes**: `Frame.svg` (hero decorative), participate icons
  (`Attend1/Showcase1/Partner1/Signup1.svg`), footer `Frame-2.svg` background mark, decorative
  corner shapes (`footerShape`, `whatgoesonshape`) sized in `vw`. Catalogued in [`05-assets.md`](./05-assets.md).
