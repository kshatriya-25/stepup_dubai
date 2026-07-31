# 03 — Animations & Interactions (matched 1:1)

The original is **not** animation-heavy — jQuery + CSS only, no GSAP/ScrollMagic. This is the
complete inventory; reproduce each with the exact trigger/value, using CSS transitions +
Framer Motion + a couple of small scroll hooks.

Global easing seen in the source: `cubic-bezier(0.77, 0.2, 0.05, 1.0)` (menu/hamburger) and
plain `ease` for opacity. Default transition duration **0.5s** for menu/hamburger; hovers are
mostly instantaneous (no explicit duration → snap) — **keep hovers snappy (~120–150ms max)**.

---

## 1. Nav: color + hide/show on scroll  (`app.js`)

```js
// on window scroll:
scrollTop >= 40           → nav.addClass('colored')      // else remove
scrollTop > lastTop && scrollTop >= 500 → nav.addClass('nav-hidden')  // scrolling down → hide
else                      → nav.removeClass('nav-hidden') // scrolling up → show
```
- `.colored` = solid `#000` (already black here; keep the hook for the transparent-hero case).
- `.nav-hidden` = translate the fixed bar up off-screen. Transition ~`transform .3s ease`.
- **React:** `useScrollDirection()` → `{ atTop: y<40, hidden: dir==='down' && y>=500 }`.
  Apply `transl-y-[-100%]` when hidden. `will-change: transform`.

## 2. Sticky countdown bar  (`app.js`)  {#countdown}

```js
if (scrollTop >= countdown.top + countdown.height - innerHeight + 785)  countdown.addClass('stick')
if (scrollTop <= 0)                                                       countdown.removeClass('stick')
if (innerHeight + scrollY >= body.height - 150)  countdown.addClass('hidden')  else remove
```
- `.stick` = `position:fixed; bottom:0; width:100%; z-index:9999; box-shadow:0 3px 9px
  rgba(0,0,0,.5)` + `animation: fadein 1s` on entry.
- `.hidden` near the page bottom so it never overlaps the footer.
- **React:** IntersectionObserver on a sentinel + a "near-bottom" observer; toggle `stick`/`hidden`.

## 3. `fadein` keyframe (the only @keyframes)

```css
@keyframes fadein { from { opacity:0 } to { opacity:1 } }  /* used as: animation: fadein 1s */
```
Applied to `.stick`. Reuse as the generic fade primitive.

## 4. Mobile menu open/close  (`app.js` / `new-apps.js`)

- Checkbox `#mobile-checkbox` change → toggles `.opened` on `.js-mobile-nav`, `.active` on
  toggle + `.js-mobile-tabs`.
- `.tabs-wrapper ul` animates via `transform .5s cubic-bezier(.77,.2,.05,1)` (slides down/in),
  `top:65px`, `height:100vh`, bg `#000`, items on green.
- Submenu items (`.js-mobile-submenu-item`) toggle `.opened` → `slideUp/Down` child submenu
  (indent `margin-left:20px`).
- **React:** `useState(open)`; animate the panel with Framer Motion (`y`/`height`), same easing.

## 5. Hamburger ↔ X morph  (pure CSS, `#mobile-menuToggle`)  {#hamburger}

Three 33×4px bars; `transition: transform .5s cubic-bezier(.77,.2,.05,1), background .5s …,
opacity .55s ease`. On `input:checked`:
```css
span            → rotate(45deg)  translate(-7px,-16px)   // top bar
span:nth-last(3)→ opacity:0 rotate(0) scale(.2)          // middle hides
span:nth-last(2)→ rotate(-45deg) translate(-3px,14px)    // bottom bar
```
Reproduce exactly — it's a recognisable detail. `transform-origin` per bar: first `0% 0%`,
last `0% 100%`.

## 6. Speaker og-grid expand  (Codrops)  {#speakers}

Click a headshot → a full-width preview panel opens **in the grid flow, right after the clicked
item's row**, pushing rows below down; shows big image + bio. Original animates the expander's
height/opacity (`.og-expander`, `padding-bottom:30px`). One open at a time; clicking another
relocates the panel; `×` closes.
- **React:** track `openIndex`; compute the row (`Math.floor(index / columns)`); render an
  expander `<motion.div>` after the last item of that row; animate `height:auto` + `opacity`
  (Framer `AnimatePresence`, ~`.35s ease`). Card hover: gradient `opacity .8` (snap).

## 7. Partner logo slider

Auto-advancing horizontal logo carousel (plugin). Reproduce with embla-carousel autoplay
(~3–4s, `loop:true`, free-scroll feel). Pause on hover.

## 8. Testimonial carousel  (`.fairly-quotes`)

Bootstrap/bxSlider carousel, `auto:true, pause:4000` (4s). Crossfade/slide between quotes; dot
indicators (1px white circles, active filled). Reproduce with a 4s-autoplay controlled carousel.

## 9. Feature image clip-paths (responsive geometry)  {#clip}

Not animated, but the shape **changes per breakpoint** — implement as responsive CSS, not JS.

| Breakpoint | `.features1 img` clip-path | `.features2 img` |
|-----------|----------------------------|------------------|
| ≥1600 / ≤1600 | `polygon(0 0, 86.2% 0, 100% 100%, 75% 100%, 0 100%)` | `polygon(11.5–12% 0, 100% 0, 100% 100%, 75% 100%, 0 100%)` |
| ≤1200 | `polygon(0 0, 87.6% 0, 100% 100%, 75% 100%, 0 100%)` | `polygon(10.5% 0, …)` |
| ≤990 | `polygon(0 0, 100% 0, 100% 85%, 0 100%, 0 100%)` (flatten) | same flatten |

## 10. Hover states (catalogue)

| Element | Hover |
|---------|-------|
| Nav dropdown item | bg green→`#171333`/#000, text→green/#fff |
| `solid` button | bg green→`#000`, text→#fff |
| `see-more` (`.btn-md-2`) | bg green→`#000`, text→#fff |
| `get-in-touch` button | bg `#171333`→mint, border→mint, text→#fff |
| Track tile / `city-date` | invert to `#fff` bg / black text |
| Speaker card | bottom gradient deepens (`opacity .8`) |
| Footer submit | green→`#fff`, text black |
| Blog pagination number | `#171333`→mint |
| Tag-cloud chip | bg→mint |

## 11. What we deliberately DON'T add (faithful mode)

No smooth-scroll, no parallax, no scroll-reveal stagger, no page transitions, no cursor
effects. If we later switch to "faithful + polish", those get added in a separate layer —
tracked, not baked in now.

---

## Implementation primitives

```tsx
// hooks
useScrollDirection()   // {atTop, hidden}
useStickyBottom(ref)   // {stick, hidden}
useCountdown(target)   // {days,hours,minutes,seconds,done}
useAutoplayCarousel(n, ms)

// wrappers
<Reveal>            // = fadein primitive (opacity 0→1, 1s) — used only where original fades
<Expander open>     // height:auto + opacity, .35s ease (speaker/mobile submenus)
```
Respect `prefers-reduced-motion`: disable autoplay + the nav hide, keep content visible.
