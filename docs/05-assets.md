# 05 — Asset Inventory

What the original loads, where it lives, and how we source/replace it. Pass 1 may hotlink or
mirror originals into `/public` for fidelity; **Pass 2 replaces all of them** with Tier-2 Rising
assets. Nothing here is redistributed publicly — Pass 1 is an internal reference build.

Local capture (this analysis): `…/scratchpad/step_analysis/` →
`raw/index.html`, `assets/css/{newdesign,styles,component,default}.css`,
`assets/js/{app,new-apps}.js`, `assets/videos/STEP-HIGHLIGHTS.mp4`.

---

## 1. Fonts

| Font | Weights | Source | In Next.js |
|------|---------|--------|-----------|
| **Alexandria** | 400, 500, 600, 700, 900 | Google Fonts | `next/font/google` `Alexandria` → `--font-alexandria` |
| ~~Work Sans, Poppins~~ | — | legacy, overridden | **drop** |
| Font Awesome 4.7 | — | CDN | **drop** → `lucide-react` |

## 2. Video

| Asset | URL (original) | Size | Use |
|-------|----------------|------|-----|
| Hero bg (webm) | `stepconference.com/videos/STEP DXB - 53 Seconds - LOW RESOLUTION 31MB.webm` | ~31MB | hero background loop |
| Hero bg (mp4) | `stepconference.com/videos/website-2020-new.mp4` | 404 now | fallback (missing) |
| Highlights | `dubai.stepconference.com/wp-content/uploads/2025/06/STEP-HIGHLIGHTS.mp4` | ~6MB (captured ✓) | highlights/"what goes on" |

**Actions:** for the hero we need a real MP4 (the referenced one 404s). Options: (a) re-encode
the captured webm → mp4 (`ffmpeg -i in.webm -c:v libx264 -crf 23 -movflags +faststart out.mp4`),
(b) transcode the 6MB highlights as a temporary hero, (c) Pass 2 supplies a Tier-2 sizzle reel.
Serve `poster` frame + `preload="none"`/`metadata`; native `<video muted loop playsinline autoplay>`.
Provide a static poster for reduced-motion + mobile (original swaps to a still on mobile).

## 3. Logos & brand marks

| Asset | File | Where |
|-------|------|-------|
| Step Dubai 2026 logo | `Step-Dubai-Logo-2026.png` | nav (149×65), footer (250×135) |
| DIC co-brand | `DIC-Logo_White-1.png` | nav `#dicLogo` (60px) |
| Alt/mobile step logos | `step-logo-1.png`, `STEP_PRIMARY-LOGO-2.png` | mobile/participate |
| Footer SVG mark | `Frame-2.svg` (`sf.stepconference.com/.../2024/05/`) | `#footer` bg @ `96% 55%`, 185px |
| Hero decorative | `Frame.svg` | burger-nav `heroImage` |

## 4. Section imagery

| Group | Files (examples) | Notes |
|-------|------------------|-------|
| Track icons | `tracks_black-01/02/05.png`, `tracks_green-03/06/09.png` | green/black variants per tile |
| "What Goes On" | `DSC09522.jpg`, `brand-activations.png`, `DSC00315.jpg`, `talks-and-workshops.png`, event photos | 6 cards |
| Speakers | headshots e.g. `Tim-Draper…png`, `Noor-Sweid-Headshot.png`, `PK-Hi-res.png`, `rania.png`, … | 100+; `object-fit:cover`, `60vh` |
| Partners | logo PNGs (`HUB71…`, `in5…`, `Zest…`, `carta…`, `gensparkai…`, `MMS…`, `ECA…`, Emirates) | greyscale-on-white tiles |
| Participate icons | `Attend1.svg`, `Showcase1.svg`, `Partner1.svg`, `Signup1.svg` | modal route tiles |
| Favicons | `favicon.ico`, `apple-touch-icon-precomposed.png` | `themes/…/app/images/icons/` |
| Decorative shapes | `footerShape`, `whatgoesonshape`, `Layer-6.png`, `pattern-1.png` | `vw`-sized corner accents (mostly commented out now) |

## 5. Handling strategy

- **Pass 1:** mirror needed originals into `/public/reference/` (fonts via next/font, video
  transcoded, logos/photos/icons copied) purely to validate fidelity **internally**. Keep a
  `MANIFEST.md` of source URLs so replacement is mechanical.
- **Pass 2:** every entry above → Tier-2 Rising equivalent:
  - Logos → Namma Office / Tier-2 Rising / partner logos (Startup Singam, BIOS, TealOrca…).
  - Speaker/partner images → our curated line-up.
  - Track icons → our zone icons (Marketing/CRM/ERP/AI/Investment/Exhibit — the Tier-2 zones).
  - Hero video → Tier-2 sizzle reel (or a static hero if none — the component supports poster-only).
  - Favicon/OG image → Tier-2 Rising brand.
- **Optimisation:** `next/image` for all raster; SVG inline or as components; videos self-hosted
  in `/public/video` with poster. Target LCP < 2.5s (hero poster paints immediately, video lazy).

## 6. Third-party scripts to NOT port

GTM, Complianz, Gravity Forms, Mailchimp validate, custom-twitter-feed, countdown-builder,
tapad/rockets pixels, hubspot iframe. Replace with: a thin analytics wrapper (gated by consent),
our own forms, our own countdown hook. Keeps the bundle tiny vs. the original's ~40 CSS/JS files.
