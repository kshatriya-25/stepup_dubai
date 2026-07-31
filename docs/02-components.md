# 02 — Component Library

Each component below lists: **structure**, **exact styles** (from source), **states**, and the
**React shape** we'll build. Original class names are kept in comments so you can cross-check
against the captured CSS.

Shared primitives → build first: `Container`, `Button`, `SectionHeading`, `Reveal` (animation
wrapper, see [`03`](./03-animations.md)).

---

## 1. `SiteNav` (desktop + mobile) — `nav.desktop`, `nav.mobile`

**Height:** desktop **85px**, mobile **65px**. Fixed to top, full-width.

**Backgrounds/behaviour**
- Default: `background:#000` (already black at top).
- On scroll ≥ 40px: adds `.colored` → stays `#000` (the class exists mainly so a future
  transparent-hero variant can darken; keep the hook).
- Hide/show: scrolling **down** past 500px adds `.nav-hidden` (translateY off-screen);
  scrolling **up** removes it. (See [`03 §1`](./03-animations.md).)

**Desktop layout** (`nav.desktop` = flex, 85px)
- **Left:** primary logo `Step-Dubai-Logo-2026.png` (`149×65`, `object-fit:contain`) +
  a **DIC co-brand** block `#dicLogo` (`DIC-Logo_White-1.png`, 60px tall) with a tiny
  `11px` caption under it. A vertical hairline (`::before`, `1px #fff`, 25px tall) separates
  logo from menu.
- **Center/left menu:** dropdown items (`.dropdown` / `.submenu-item`) — Alexandria 16px/22
  white; each with a chevron (`.chevron-btn`, FA caret). Hover opens `.dropdown-content` /
  `ul.submenu` positioned at `top:85px`, items on **green `#00FF00`** bg, black text; item
  hover → `#171333`/black bg + white text.
- **Right:** `participate` button (transparent, green text, uppercase) + **`Get tickets`**
  button (`.menu_buy_ticket_btn`, **green bg, black text**, `padding:0 35px`, full-height). A
  green hairline (`::before`) precedes the CTA group.

**Mobile layout** (`nav.mobile`, ≤990px, 65px)
- Logo `135×55` left; **hamburger** right (`#mobile-menuToggle`, three 33×4px white bars,
  `border-radius:3px`).
- Hamburger → **X** morph via transforms (exact keyframes in [`03 §5`](./03-animations.md)).
- Tapping opens `.tabs-wrapper ul` (slides via `transform .5s cubic-bezier(.77,.2,.05,1)`),
  full-height `100vh`, each `<li>` on **green** bg, 24px items, 1px white dividers, submenu
  indents `margin-left:20px`. Bottom: two action buttons (`participate` etc.) on `#171333`
  bg, green border+text, `22px`, each `width:calc(50% - 5px)`.

**React shape**
```tsx
<SiteNav
  logo={StepLogo} coBrand={DICLogo}
  menu={[{ label, href, children? }]}
  ctas={[{ label:'Participate', variant:'ghost', onClick }, { label:'Get tickets', href, variant:'solid' }]}
/>
// internal: useScrollDirection() → { colored, hidden }; useState for mobile open
```

---

## 2. `Button` / `.action-buttons-mod` / `.btn`

One primitive, several variants. All **square (radius 0)**, **uppercase**, Alexandria.

| Variant | Bg | Text | Hover | Source class |
|---------|----|------|-------|--------------|
| `solid` (default CTA) | green `#00FF00` | black | bg→`#000`, text→#fff | `.action-buttons-mod`, `.gform_footer input` |
| `ghost` (nav participate) | transparent | green | text→#fff | `.action-buttons .btn` |
| `ticket` | green | black | stays green | `.menu_buy_ticket_btn` |
| `see-more` | green | black | bg→`#000`, text→#fff | `.btn-md-2` |
| `dark` (get-in-touch) | `#171333` | mint `#73ECCF` | bg→mint, text→#fff | `.get-in-touch .btn` |
| `outline-green` (footer/mobile) | transparent | green | bg→green, text→#fff | `.footer-3 .btn` |

Padding norm: `~14px 25px` (submit `padding:16px 25px 12px` — note the optical **+4px top /
-4px bottom** to sit Alexandria's baseline; replicate). Sizes 16–22px. `max-width:368px`,
`width:100%` in stacked/mobile contexts.

```tsx
<Button variant="solid" href="…">Get Tickets</Button>
```

---

## 3. `Hero` — `section.techFestivalForm.transparentBG` + video

**Two-layer hero:** a fullscreen background **video** (`.hero-section video`, `object-fit:cover`,
`min-height:100%`, `padding-top:100px`) behind a **black content card** floated left.

**Content card** (`.techFestivalForm`): `max-width:520px; margin:120px 0 50px 50px;
padding:30px; background:#000` (desktop). Mobile: full-width, **green `#00FF00` bg**, centered,
`padding:90px 15px 50px`.

Inside (`#hero-head`), all inline-styled in the source — reproduce as tokens:
- `h1.hero-title` — "SEE YOU AT STEP" — 45px/1.1, 700, uppercase, `word-spacing:-4px`, white.
- `p.hero-theme` — theme line ("Intelligence Everywhere: The AI Economy") — 14.5px, 650,
  uppercase, `letter-spacing:.5px`.
- `h1.hero-sub` — `span.hero-date` ("3-4 February 2027") block + `span.hero-venue`
  ("Dubai Internet City") block (`margin-top:-20px` to tuck up under the date).
- Then **stacked CTA buttons** (`.action-buttons-mod`): *Get Tickets*, *Exhibit or Sponsor*,
  *(third)* — each `margin-top:10px`, full-width of the card.

**Video heights (responsive, from `app.js` + CSS):** desktop `785px` region; `<990` → `881`;
`<768` → hero video `height:195px; top:97px`. Mobile hides the `.beforeVideo` spacer.

**React shape**
```tsx
<Hero
  video={{ mp4, webm, poster }}
  title="SEE YOU AT STEP" theme="Intelligence Everywhere: The AI Economy"
  date="3-4 February 2027" venue="Dubai Internet City"
  ctas={[…]}
/>
```
> Video: original hero used `data-vide-bg` (vide.js). We use a native muted autoplay
> `<video loop playsinline poster>`; poster shown until canplay. Sources in [`05`](./05-assets.md).

---

## 4. `CountdownBar` — `.countdown` (`#demo`) + sticky behaviour

A promo countdown ("The Last Chance Saver rate ends in:") that becomes a **fixed bottom bar**.

**Structure:** `.countdown` (flex, white bg, `padding:12px 0`) →
`.countdown-message` (bold 22px) · `.countdown-wrapper` → `#demo` row of `.number` groups
(**42px/700 indigo**, digits separated by `<span>` margins `0 6px`) with a `.name-wrapper` of
tiny labels (**9px/500 indigo @ .5 opacity**: DAYS · HOURS · MIN) · `.button-wrapper`
(indigo `#171333` bg, white 22px link → the CTA).

**Sticky logic** (from `app.js`):
- On scroll, once `scrollTop ≥ countdown.offset().top + outerHeight − innerHeight + 785` →
  add `.stick` → `position:fixed; bottom:0; width:100%; z-index:9999; box-shadow:0 3px 9px
  rgba(0,0,0,.5)` and fades in (`animation:fadein 1s`).
- `scrollTop ≤ 0` → remove `.stick`.
- Within 150px of page bottom → add `.hidden` (hide so it doesn't cover the footer).

**React:** `useCountdown(targetDate)` hook returns `{days,hours,minutes,seconds}`; a
`usePinToBottom()` observer toggles `stick`/`hidden`. Timezone: Asia/Dubai (Pass 2: Asia/Kolkata).

---

## 5. `Scores` — `section.scores` (stats strip)

Black band. Bootstrap `.row` of four `.col-md-3` `.box-content`:
`<h2>` big number + `<p>` label (white, 18px/30). Values: **8000+ Attendees · 400+ Showcasing
Startups · 100+ Participating Companies · $9 Billion Funding Present**. `padding:20px 25px`.
Mobile (≤988): stack, each with `border-bottom:1px solid rgba(255,255,255,.3)`, last has none.

```tsx
<Scores items={[{n:'8000+',label:'Attendees'}, …]} />
```

---

## 6. `Tracks` — `.conferences-section` (currently `display:none` on home)

Hidden on the live home right now but fully styled — **build it, hide via prop**. `.row` of
tile columns (`col-md-4`), each a full-bleed `<a>` with a centered track-logo `<img>` on a
solid tile bg. Tiles alternate `#27FE00` green / `#000` black. Desktop `height:60vh`; mobile
stacks to `300px` tiles, logo `width:240px`. Tile has a colored overlay tint per track
(`.start/.fintech/.future/...` → tinted rgba). Links to `/tracks/<slug>/`.

```tsx
<Tracks show={false} tiles={[{slug,logo,bg:'#27FE00'|'#000',tint}]} />
```

---

## 7. `Partners` — `section.partners.dark` (×3 blocks) + logo slider

Three stacked partner blocks on the home, each = green **`h2`** band label
(`padding:50px 0; font-size:48px; uppercase`) + a horizontal **logo slider**.

- Block 1 `category-3995` → **PRESENTED BY**
- Block 2 `category-4068` → **STRATEGIC PARTNER 2026** (grid of logos: Hub71, in5, Zest, Carta,
  Genspark.ai, MMS, ECA, …)
- Block 3 `category-4063` → **OFFICIAL AIRLINE PARTNER** (Emirates) with a one-line blurb.

Slider = the `partners-slider-v2-block` plugin (auto-advancing logo carousel). Logos
`.partners-slider-image`, greyscale-on-white tiles, `item-width:20%` desktop / `70%` mobile.
There are also **"previous partners"** and **"Super Partner"** rows lower down.

**React:** `<PartnerRow label bg="green" logos={[{src,alt,href}]} variant="slider|grid" />`
using a small embla-carousel (autoplay) instead of the plugin.

---

## 8. `SpeakerGrid` — Codrops **og-grid** (`.speakers .og-grid`)

The one non-trivial interaction. A **CSS grid** `repeat(5, 1fr)`, `gap 5px/15px`. Each `<li>`:
a full-bleed headshot (`img` `height:60vh`, `object-fit:cover`) with a **bottom gradient**
(`linear-gradient(to bottom, transparent, #000)`, `opacity:.8`) and the name/role overlaid
bottom-left (`p.title` 24px white + `span` role). On hover the gradient deepens.

**Expand interaction (Codrops "thumbnail grid with expanding preview"):** clicking a card opens
`.og-expander` — a **full-row panel inserted below the clicked item's row** that slides open and
shows the large image + full bio (`.preview-data-container`: `.preview-image .frame` + `.preview-info`
with `h4` role in green, bio text, close `×`). Only one open at a time; clicking another moves
the panel; `×` (`.close-btn-outer`) closes.

Header band above the grid: green strip, centered, "Step Dubai 2026 Speakers" (`h2` white on
green, with a decorative green `::after` block on desktop). A **"see more speakers"** button
(`.btn-md-2`) links to the full speakers page. Grid → 2-up on mobile (`168×258` cards).

**React:** implement as a controlled grid with an absolutely/inline-inserted expander row
(compute the clicked item's row, portal the panel after it), animate height/opacity with
Framer Motion. `<SpeakerGrid columns={5} speakers={[{img,name,role,bio}]} />`. Data model in [`06`](./06-build-plan.md).

---

## 9. `WhatGoesOn` — `.what-you-get` (6 image cards)

Centered `h2` "WHAT GOES ON" (50px/700 uppercase). Then a grid (`col-lg-4`) of **6 cards**
(`.whitebox`): image + `h3` label. Labels: **Entertainment · Brand Activations · Exhibition
Areas · Satellite Events & Meet-ups · Startup Programming · Talks and Workshops**. Cards carry
a green action button (`.action-buttons-mod`, hover→green/`--red`=green, text white). Optional
decorative corner shapes (`whatgoesonshape`, `vw`-sized, currently commented) top-right.

```tsx
<WhatGoesOn heading="What Goes On" cards={[{img,label,href}]} />
```

---

## 10. `Testimonials` — `.fairly-quotes` (Bootstrap carousel)

Radial-indigo bg `radial-gradient(50% 50% at 50% 50%, #1B1754, #171233)`. Each slide: a quote
`h2` (white, 20px/25, `margin:0 120px 25px 60px`) + attribution `p` (**mint #73ECCF**, 30px/700).
`.carousel-indicators` bottom-left (`margin-left:60px`), 1px white circles, active = filled white.
Auto-advances (original bxSlider `pause:4000, auto:true`).

**React:** embla or a tiny controlled carousel, 4s autoplay, dot indicators. Content = 4 quotes.

---

## 11. `SiteFooter` — `section.footer` + `.footer-copyright`

Warm off-white `#F9F7F1`, `padding:50px`. Three columns:
- **footer-1:** Step Dubai 2026 logo (`250×135` bg-image), contact email, social icons.
- **footer-2/newsletter:** `.newslettersec` (centered, `margin:0 20%`), title (green, uppercase),
  a Mailchimp/Gravity form (first/last/email → **green submit button**, full-width, uppercase).
  Note: on the black footer variant `#footer` uses `background:#000` + an SVG mark
  (`Frame-2.svg`) at `96% 55%`.
- Footer nav links (white, 16px), dropdown.

**`.footer-copyright`:** green `#00FF00` bar, `padding:10px 50px`, black uppercase 16px/14 copyright.

Also a **`get-in-touch`** band variant (teal→slate gradient) with a big centered line + a dark
CTA button — used on inner pages.

```tsx
<SiteFooter logo email socials nav newsletter={<NewsletterForm/>} />
```

---

## 12. `ParticipateModal` — `header.header` "Participate" overlay

Full-screen menu (`#participate-modal-menu`, toggled `.opened`) opened by any
`.js-participate-modal` trigger (nav "participate" buttons). Green `#00FF00` panel, a `logo`,
`h2` "Participate", and **4 route tiles** with SVG icons: **Attend · Showcase · Partner ·
Sign up** (`Attend1/Showcase1/Partner1/Signup1.svg`), each linking into the relevant flow.
Close by the `×` or clicking the backdrop. Backdrop tint `#00ff0057`.

```tsx
<ParticipateModal open onClose routes={[{icon,label,href}]} />
```

---

## 13. Forms (`NewsletterForm`, `RegisterForm`, participate forms)

Original = **Gravity Forms** + Mailchimp. Rebuild as controlled React forms:
- Inputs: transparent, **`border-bottom:1px solid`** (white on dark / black on light), 14–15px,
  placeholder same color, left-aligned, `padding:15px`, faint `background:#00000014` on light.
- Submit = `solid` green Button, full-width, uppercase.
- First/last name share a row (`width:47%` each).
- Post to our API/CRM (Pass 1 can stub → `/thank-you`). Validation: required + email regex;
  the original also blocked disposable domains (mailinator/guerrillamail/etc.) — optional.
- Thank-you routes already exist as pages: `/thank-you`, `/forms-thanks`, `/startup-thankyou`,
  `/ticket-successful`, `/startup-approved`, `/thanks-startups`.

---

## 14. `CookieBanner` — Complianz replacement

Bottom banner with **Accept / Deny / View preferences / Save preferences** + a "Manage consent"
re-open tab. Rebuild with a minimal consent context (stores choice in `localStorage`, gates
GTM/analytics). Not visually prominent; match: dark banner, green accept button.

---

## Component build order (dependency-first)

1. `Container`, `Button`, `SectionHeading`, `Reveal`
2. `SiteNav`, `SiteFooter`, `CookieBanner` (shell — every page needs these)
3. `Hero`, `CountdownBar`
4. `Scores`, `WhatGoesOn`, `Tracks`
5. `PartnerRow`, `Testimonials`
6. `SpeakerGrid` + expander (most complex)
7. `ParticipateModal`, forms
