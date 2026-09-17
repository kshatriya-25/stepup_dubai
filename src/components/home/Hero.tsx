'use client'

import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { site } from '@/content/site'
import { launch, partners } from '@/content/home'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } } }
const item = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
}

/*
 * The partner's site, read from the Partners section's own list rather than written out
 * again here. Two copies of a URL drift the first time one of them changes — and a credit
 * that links somewhere different from the partner card further down the same page is the
 * kind of thing a partner notices.
 *
 * No URL, no link: an unknown name renders the logo inert instead of guessing. Same rule
 * as the Partners section — a dead or invented link is worse than none.
 */
function partnerUrl(name: string): string | undefined {
  return partners.find((p) => p.name === name)?.url
}

/**
 * A credit logo that goes to the partner's site when there is one, and is a plain image
 * when there is not.
 *
 * The link wraps the MARK ONLY, not the "Presented by" caption above it: the caption is a
 * label, not a destination, and a 120px-tall hit area around a 54px logo would make the
 * blank band beneath Namma Office clickable too. `className` carries the optical-centring
 * offset, so it moves onto whichever element is outermost.
 */
function CreditLink({
  name,
  className,
  children,
}: {
  name: string
  className?: string
  children: ReactNode
}) {
  const href = partnerUrl(name)
  if (!href) return <span className={className ? `block ${className}` : 'block'}>{children}</span>
  return (
    <a
      href={href}
      target="_blank"
      // noopener stops the opened tab from reaching back through window.opener and
      // navigating this one somewhere else.
      rel="noreferrer noopener"
      aria-label={`${name} (opens in a new tab)`}
      className={[
        'block transition-opacity duration-200 hover:opacity-80',
        // ring-offset in the panel's own navy, so the focus ring floats off the mark
        // instead of sitting in a hard band of the page's colour.
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-base',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </a>
  )
}

/**
 * The launch photograph and who was on stage for it.
 *
 * A <figure>/<figcaption>, not a div with text under it: the caption names the people in
 * the picture, which is exactly the association figcaption exists to express — and it is
 * what lets a screen reader read the photo and its credit as one thing.
 *
 * WIDTH. Capped at 870px when stacked so it lines up with the panel above it, which is the
 * one number here that is copied rather than derived — the panel is `w-fit` and CSS has no
 * way to hand its resolved width to a sibling. 870 = the 750px credits row + 120px of
 * panel padding; if those change, this follows. Side by side it drops the cap and takes
 * whatever is left of the row.
 */
function LaunchPhoto() {
  return (
    <motion.figure
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      // Behind the panel's own stagger, so the eye lands on the summit first and the
      // proof second — the panel's last child finishes at roughly 0.2 + 4 x 0.1 + 0.7.
      transition={{ duration: 0.7, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
      /*
        ON A PHONE THIS IS PART OF THE PANEL, not a block under it. The client's layout has
        one navy card holding everything, so the figure paints the same `bg-base/75` and the
        stack's gap drops to 0 — two blocks of identical translucent navy over the same video
        meet with no seam, which is cheaper and less brittle than moving this node into the
        panel on one breakpoint and out of it on another. Its horizontal padding matches the
        panel's `p-6` so the photo lines up with the credits above it.
      */
      className="m-0 w-full min-w-0 bg-base/75 px-6 pb-6 sm:max-w-[870px] sm:bg-transparent sm:p-0 min-[1400px]:max-w-none min-[1400px]:flex-1"
    >
      {/*
        Sharp corners and a hairline, matching the panel beside it — the mock-up's soft
        corners are the deck's house style, not this site's. `bg-night/40` is what a slow
        connection shows instead of a bright hole in the middle of the hero.

        NO `loading="lazy"` — the default (eager) is what this wants. It is above the fold at
        every width, and lazy-loading a hero image is a well-known way to lose LCP.

        No `fetchPriority="high"` either, tempting as it is: @types/react declares it but
        react-dom 18.3.1 does not implement it (grep the package — nothing), so React treats
        it as an unknown camelCase prop and warns in the console on every render. It buys a
        priority hint; it costs a warning on every homepage load. Revisit on React 19.
      */}
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={launch.photo.src}
        srcSet={launch.photo.srcSet}
        // Stacked it fills the column up to 870px; side by side it is roughly a third of a
        // wide viewport. Without this the browser assumes 100vw and fetches the 1600 every
        // time, including on a phone showing it 340px wide.
        sizes="(min-width: 1400px) 40vw, (max-width: 920px) 100vw, 870px"
        width={launch.photo.width}
        height={launch.photo.height}
        alt={launch.photo.alt}
          className="block h-auto w-full border border-surface/20 bg-night/40 object-cover"
        />

        {/*
          Phone only. The caption line has no room for the date at this width, so the date
          moves onto the photograph and the caption keeps the sentence — the same two facts,
          split where the space is. Deliberately NOT aria-hidden: on a phone this is the only
          place the date appears.

          BOTTOM-RIGHT, not bottom-left: the unveiling graphic has an orange swoosh in its
          bottom-left corner, and an orange badge on it would all but disappear.
        */}
        <p className="absolute bottom-0 right-0 bg-accent px-2.5 py-1.5 font-sans text-[10px] font-bold uppercase leading-none tracking-[0.1em] text-accent-ink sm:hidden">
          Unveiled {launch.dateShort}
        </p>
      </div>

      {/*
        THE TICKET PERFORATION — phone only, and the reason the card reads as a pass rather
        than a panel: a dashed tear line with a notch bitten out of each edge.

        `-mx-6` cancels the figure's padding so the line and the notches reach the card's
        true edges. The notches are circles of `bg-night` straddling those edges — an
        approximation of a real cut-out, which would need a radial-gradient mask on two
        separate background blocks. At 14px, half of it overhanging a card that already sits
        on the hero's darkened wash, the difference is not visible; over a bright frame of
        the video it would be, so this is the thing to revisit if the footage ever changes.

        aria-hidden: it is a decorative rule, and the caption below already reads as the
        photograph's credit.
      */}
      <div aria-hidden className="relative -mx-6 my-5 sm:hidden">
        <div className="mx-6 border-t border-dashed border-surface/30" />
        <span className="absolute left-0 top-0 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-night" />
        <span className="absolute right-0 top-0 h-3.5 w-3.5 -translate-y-1/2 translate-x-1/2 rounded-full bg-night" />
      </div>

      <figcaption className="sm:mt-5">
        {/*
            `sm:text-[1rem]`, NOT `sm:text-base`.

            tailwind.config.ts defines `base` as a COLOUR (#072B5F, the brand navy) as well
            as a font size, so Tailwind emits `.text-base` twice — once for the size, once
            for the colour. The colour copy lands inside the `sm` media query, which comes
            later in the sheet than plain `.text-surface`, so above 768px this line rendered
            navy on a dark hero and vanished. It was white on a phone and invisible on a
            laptop, which is the worst way for it to fail.

            Same trap as the nav links in SiteNav.tsx and the pass prices in RegisterModal.
            Anywhere a 1rem font size meets a colour, write the size as an arbitrary value.
          */}
          <p className="font-sans text-sm font-bold leading-snug text-surface sm:text-[1rem]">
          {launch.caption}
          {/* The date is on the photograph itself at phone widths — see the badge above. */}
          <span className="hidden sm:inline">
            <span className="text-surface/60"> · </span>
            {launch.date}
          </span>
        </p>

        {/*
          One block per group, each a label over a list of people. `<dl>` was the other
          option and is wrong here: "Unveiled by" is a heading for a group, not a term whose
          definition is a person.
        */}
        <div className="mt-4 flex flex-col gap-3.5">
          {launch.groups.map((group) => (
            <div key={group.label}>
              <p className="font-sans text-[10px] font-bold uppercase leading-none tracking-[0.16em] text-surface/50">
                {group.label}
              </p>
              <ul className="mt-2 flex flex-col gap-1">
                {group.people.map((person) => (
                  /*
                   * The name carries the weight and the role does not, so the four lines
                   * scan as four people rather than eight pieces of text.
                   *
                   * A phone stacks the role under the name behind a small accent square;
                   * from sm up it runs on after a middot. One <li> either way — `sm:block`
                   * drops the flex row, and the square and the middot each appear only on
                   * their own side of the breakpoint. The square is aria-hidden: it is a
                   * bullet, and a list already announces itself as a list.
                   */
                  <li
                    key={person.name}
                    className="flex gap-2.5 text-[13px] leading-snug text-surface/75 sm:block sm:text-sm"
                  >
                    <span aria-hidden className="mt-[5px] h-1.5 w-1.5 shrink-0 bg-accent sm:hidden" />
                    <span className="min-w-0">
                      <span className="font-semibold text-surface">{person.name}</span>
                      <span className="hidden px-1.5 text-surface/40 sm:inline">·</span>
                      <span className="block sm:inline">{person.role}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </figcaption>
    </motion.figure>
  )
}

export function Hero() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden">
      {/* full-bleed footage — no box */}
      <video
        className="absolute inset-0 h-full w-full object-cover brightness-110 contrast-[1.05] saturate-[1.1]"
        src="/video/hero.mp4"
        poster="/video/hero-poster.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />
      {/* legibility washes — text sits directly on the video like the original */}
      <div className="absolute inset-0 bg-gradient-to-t from-night/90 via-night/30 to-night/50" />
      {/*
        The right end used to be `to-transparent`, which was right when nothing was over
        there. The launch photo's caption is white text sitting directly on the footage, and
        the footage is bright green foliage for part of its loop — so the wash now keeps
        ~45% at the right edge. The left is unchanged at /80, and the panel paints its own
        75% navy on top of it either way, so the reading over the copy is exactly as before.
      */}
      <div className="absolute inset-0 bg-gradient-to-r from-night/80 via-night/40 to-night/45" />

      {/*
        The panel is vertically centred by the section, so its resting position is set by
        the DIFFERENCE between these two paddings, not by either one alone: it sits
        (pt - pb) / 2 below the middle. sm was pt-24/pb-16, i.e. 16px low; pt-40/pb-12 puts
        it 56px low, which is the "slightly downward" the client marked up.

        It was pt-40/pb-12, i.e. 56px low, when the credits sat at the FOOT of the panel.
        They are at the top now and much bigger, so the panel grew upward — and the client's
        note was to take that growth out of the empty footage above rather than out of the
        Tier-2 lockup below, which was the other option on the table and was declined.
        pt-28/pb-16 is 24px low: the panel is taller than before but its top edge has barely
        moved, which is what "move Presented by up, there is space at the top" asks for.

        Do not pay for a downward offset with pt alone. Only the gap between the two matters
        for position, so raising pt without lowering pb adds the whole amount to the
        section's height and pushes the tagline below the fold on a 13" laptop, where the
        hero already overflows min-h-screen and `items-center` stops centring anything.
      */}
      {/*
        WIDER THAN `max-w-container-wide` (1300px), which every section below still uses.
        The hero is the one full-bleed section on the page and it now carries two things
        side by side: a panel that hugs a 750px row of partner marks, and the launch photo.
        At 1300px those leave the photo ~340px — a stamp. 1680px gives it ~660px at the
        sizes people actually browse at, which is the proportion the client's mock-up shows.
      */}
      <div className="relative mx-auto w-full max-w-[1680px] px-4 pb-16 pt-24 sm:px-6 sm:pb-16 sm:pt-28">
        {/*
          SIDE BY SIDE ONLY FROM 1400px, and the number is arithmetic rather than taste: the
          panel is a fixed ~870px (see the credits block below — 750px of logos plus 120px of
          padding), so a photo worth showing needs 1400 - 48 - 870 - 48 = 434px and up. Below
          that they stack, panel first.

          1400 is deliberately NOT one of the project's breakpoints (tailwind.config.ts:
          lg is 1200, xl is 1600). Neither fits: at lg the photo would be 234px, and waiting
          for xl would stack it on every normal laptop.
        */}
        <div className="flex flex-col gap-0 sm:gap-9 min-[1400px]:flex-row min-[1400px]:items-center min-[1400px]:gap-12">
          {/*
          Copy sits on a translucent navy panel rather than straight on the footage — 75% of
          the brand navy (#072B5F), so the video still reads through it.

          `w-full sm:w-fit`. Fit-content is what stops the panel sprawling across a desktop
          (it hugs the partner row — see the credits block), but on a phone it is wrong: the
          launch photo below is `w-full` and paints the SAME translucent navy to continue the
          panel, so a fit-content panel would be narrower than the photo and the join would
          show as a step. Full width below sm makes the two agree at every phone size, and it
          is what the client's mobile layout draws anyway — one card, edge to edge.

          Padding drops to 24px on a phone. It was 60px from 400px up, which was fine when
          this held only text; with the partner marks now on one line it left them nothing.
        */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="flex w-full max-w-5xl shrink-0 flex-col bg-base/75 p-6 sm:w-fit sm:p-[60px]"
          >
            {/*
            PRESENTER CREDITS, as marks rather than as words, and they OPEN the panel.

            They were at the foot of it, under the tagline, which is the conventional place
            for a credit and the wrong one here: the presenter and its partners are why a
            reader should trust the summit, and a reader who has to get past the whole panel
            to find out who is behind it has already decided whether to. They also used to be in the header —
            see the note in SiteNav.tsx — where they were 24px tall and squeezing the nav.
            One placement, at a size where the marks are recognisable, replaces both.

            This block also replaces the "{initiativeBy} · {season}" eyebrow that used to
            open the panel. It said "NammaOffice Presents · In association with Startup
            Singam" — word for word what these two labels say — so keeping it would have
            printed the same credit twice inside one panel.

            Startup Singam uses the -reverse asset, not the file the light sections use.
            The supplied mark is dark blue type flattened onto white; dropped straight onto
            this navy it is unreadable, which is why the header used to give it a white
            chip. See scripts/startupsingam-reverse.py.

            ON A PHONE THE THREE SIT IN ONE CENTRED LINE, which is the client's mobile layout
            and the reason for the four size tiers below. The row cannot be allowed to
            overflow and the marks must not be shrunk further than the width demands, so each
            tier is the largest that fits its band — measured against the real Alexandria
            label widths, not guessed:

              viewport   logos (N/S/TN)   gap   row    content   
              320-359    18 / 40 / 16      12   wraps   240      two lines, centred
              360-439    18 / 40 / 16       8   266     280
              440-559    20 / 44 / 18      12   300     360
              560-767    26 / 56 / 23      20   394     480
              768+       49 / 108 / 43     40   750     desktop, wraps under ~920 as before

            `content` is the viewport less the container's px-4 and the panel's p-6. Below
            360px the row wraps rather than shrinking again — at that width the LABEL, not
            the logo, is the wider half of two of the three columns, so shrinking the marks
            would buy nothing.

            NAMMA OFFICE AND STARTUP SINGAM ARE BALANCED BY PRESENCE, NOT BY CAP HEIGHT.
            Matching letter size was the first attempt and the client's review caught it: a
            5.8:1 wordmark at the same letter height as a 1.76:1 stacked mark takes more than
            twice the footprint, so Namma Office read as the headline act and Startup Singam
            as a footnote. The brief was "50% and 45%" — near-equal presence, Singam just
            behind. That is why Startup Singam is by far the TALLEST mark here, and why that
            is correct rather than something to tidy up.

            THREE CREDITS, ONE ROW, AND THE PANEL HUGS THE ROW. This is where the arithmetic
            lives; change a number here and re-run it.

              Namma Office     286px  (49px tall, 5.84:1)
              gap               40
              Startup Singam   191px  (108px tall, 1.76:1)
              gap               40
              StartupTN        194px  (43px tall, 4.50:1)
                               ─────
                               750px   + 120px padding = an 870px panel

            THE PANEL IS `w-fit`, NOT A FIXED WIDTH. It was max-w-5xl, which made it 1024px
            regardless of what was in it: once StartupTN joined, the logos only filled 824px
            of that and the rest of the panel — everything to the right of the Tier-2 lockup
            and the tagline — was a slab of empty navy over the footage. Fit-content sizes it
            to its widest child, which is this row, so the panel is exactly as wide as the
            partner strip and no wider. Resize a logo and the panel follows; nobody has to
            remember to retune a max-width. max-w-5xl is kept as a ceiling only.

            The sizes are 90% of what the client first approved (54 / 120 / 48), cut
            uniformly so the relationships they signed off on — Namma / Singam at "50 and
            45", StartupTN's letters a touch larger than Namma's — are unchanged. Do not trim
            one mark on its own to win back width; that is how a partner strip turns, ten
            rounds later, into three logos too small to recognise.

            Two alternatives were rendered at true size and rejected:
              the old panel width   StartupTN gets 180px and reads as the junior partner.
              two tiers             Namma Office alone on a thin top row under Startup
                                    Singam: the PRESENTER reads smallest, and the panel
                                    grows 103px taller.

            SIZED BY LETTER HEIGHT, NOT BY BOX. "Looks small" means the letters look small.
            Namma Office's caps render 27px tall at 49px (its trident eats the top of the
            box). StartupTN at 43px renders 31px caps — a touch larger, on purpose, because
            StartupTN is a much shorter word and would otherwise read as the lesser mark at
            equal letter height.

            Below ~920px of viewport the row does not fit, and the panel narrows to the
            space available while StartupTN wraps to a second line. That is the intended
            failure mode: flex-wrap, not overflow, and not smaller marks.

            THE LOGOS SIT IN A FIXED-HEIGHT ROW — the height of the tallest mark, Startup
            Singam — so every column is the same height and the three labels share a line.

            Inside that row each mark is `items-start` plus an explicit margin that lines up
            its LETTERS with the centre of Startup Singam's artwork. Neither flex value does
            it alone — `items-center` centres the box and `items-start` hangs it at the top,
            and the eye judges neither. It judges the ink:

              Namma Office  letters centre at 70.8% of its box (a trident spikes above them)
              StartupTN     letters centre at 41.2% of its box (the rocket flames hang below)
              Startup Singam artwork centres at 47.1% of its box (slack at the bottom)

                          sm and up                             mobile
              Namma     mt = 108 x 0.471 - 49 x 0.708 = 16.2    72 x 0.471 - 32 x 0.708 = 11.2
              StartupTN mt = 108 x 0.471 - 43 x 0.412 = 33.2    72 x 0.471 - 32 x 0.412 = 20.7

            They are not round numbers and they are not padding. Re-derive them if any of
            the three heights changes.

            `items-center` on each COLUMN is load-bearing too. A flex column stretches its
            children across the cross axis by default, an <img> with `w-auto` stretches with
            it, and `object-contain` then letterboxes the artwork and centres it in a box as
            wide as the column — which indented Startup Singam from its own label. Any value
            other than `stretch` stops that; `center` is the one that also centres each label
            over its mark, as the client asked.

            StartupTN uses the -reverse asset. It is navy type on a pale ground as supplied,
            and on this panel it needs white letters and a white medallion behind the Tamil
            Nadu seal — see scripts/startuptn-reverse.py for why the seal gets a medallion
            rather than a knockout.
          */}
            <motion.div
              variants={item}
              className="order-1 mb-6 flex flex-wrap items-start justify-center gap-x-3 gap-y-4 border-b border-surface/20 pb-5 min-[360px]:flex-nowrap min-[360px]:gap-x-2 min-[440px]:gap-x-3 min-[560px]:gap-x-5 sm:mb-9 sm:flex-wrap sm:justify-start sm:gap-x-10 sm:gap-y-7 sm:pb-8"
            >
              <span className="flex flex-col items-center gap-1.5 sm:gap-3">
                <span className="whitespace-nowrap text-[7px] font-semibold uppercase leading-none tracking-[0.1em] text-surface sm:text-[9px] sm:tracking-[0.2em]">
                  Presented by
                </span>
                <span className="flex h-10 items-start min-[440px]:h-11 min-[560px]:h-14 sm:h-[108px]">
                  <CreditLink name="NammaOffice" className="mt-[6px] min-[440px]:mt-[7px] min-[560px]:mt-[8px] sm:mt-[16px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/logos/nammaoffice-v3.png"
                      alt="Namma Office"
                      width={900}
                      height={154}
                      className="h-[18px] w-auto object-contain min-[440px]:h-5 min-[560px]:h-[26px] sm:h-[49px]"
                    />
                  </CreditLink>
                </span>
              </span>

              <span className="flex flex-col items-center gap-1.5 sm:gap-3">
                <span className="whitespace-nowrap text-[7px] font-semibold uppercase leading-none tracking-[0.1em] text-surface sm:text-[9px] sm:tracking-[0.2em]">
                  <span className="sm:hidden">In association</span>
                  <span className="hidden sm:inline">In association with</span>
                </span>
                <span className="flex h-10 items-start min-[440px]:h-11 min-[560px]:h-14 sm:h-[108px]">
                  <CreditLink name="Startup Singam">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/logos/startupsingam-reverse-v1.png"
                      alt="Startup Singam"
                      width={300}
                      height={170}
                      className="h-10 w-auto object-contain min-[440px]:h-11 min-[560px]:h-14 sm:h-[108px]"
                    />
                  </CreditLink>
                </span>
              </span>

              <span className="flex flex-col items-center gap-1.5 sm:gap-3">
                <span className="whitespace-nowrap text-[7px] font-semibold uppercase leading-none tracking-[0.1em] text-surface sm:text-[9px] sm:tracking-[0.2em]">
                  <span className="sm:hidden">Ecosystem</span>
                  <span className="hidden sm:inline">Ecosystem partner</span>
                </span>
                <span className="flex h-10 items-start min-[440px]:h-11 min-[560px]:h-14 sm:h-[108px]">
                  <CreditLink name="StartupTN" className="mt-[12px] min-[440px]:mt-[13px] min-[560px]:mt-[17px] sm:mt-[33px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/logos/startuptn-reverse-v1.png"
                      alt="StartupTN"
                      width={900}
                      height={200}
                      className="h-4 w-auto object-contain min-[440px]:h-[18px] min-[560px]:h-[23px] sm:h-[43px]"
                    />
                  </CreditLink>
                </span>
              </span>
            </motion.div>

            {/*
            THE LOGO IS THE H1. It carries "Tier-2 Rising" and "Startup Summit" in one
            lockup, which is why both the old type heading and the {site.subhead} line
            below it are gone rather than sitting under the image repeating it.

            The alt text is doing real work here: it is the page's only H1 text, so it has
            to read as a heading, not as a description of a picture ("logo", "image of").

            Sized by WIDTH, not height. The asset is 600x386, and a height rule on a mark
            this irregular makes the wordmark grow and shrink unpredictably across
            breakpoints. 300px was the reduction the client asked for, and it is held there
            deliberately as the panel has grown around it: the panel widened to fit the
            partner marks above, not to make room for a bigger event logo, and they declined
            the option of shrinking this one to make the partners fit.
          */}
            <motion.h1 variants={item} className="order-2 self-center sm:self-start">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/logo-v2.png"
                alt="Tier-2 Rising Startup Summit"
                width={600}
                height={386}
                className="block h-auto w-[220px] xs320:w-[250px] sm:w-[300px]"
              />
            </motion.h1>

            {/*
              THE TAGLINE AND THE DATE SWAP PLACES ON A PHONE — `order-3`/`order-4` against
              `sm:order-4`/`sm:order-3`, which is why the panel is a flex column at all.

              On the desktop panel the date sits straight under the lockup, where it reads as
              part of the event's title block. On the phone the client's layout puts the
              sentence there instead and turns the date and venue into a labelled footer for
              the block — so the order is reversed rather than the markup duplicated.
            */}
            <motion.p
              variants={item}
              className="order-3 mt-5 max-w-md text-center text-[15px] leading-relaxed text-surface/90 sm:order-4 sm:mt-4 sm:text-left sm:text-lg"
            >
              {site.theme}.
            </motion.p>

            {/*
              TWO PRESENTATIONS OF THE SAME THREE FACTS, not two sources for them — every
              value below is site.dates / site.datesCompact / site.venue / site.city.

              They are separate markup because they differ in more than styling: the phone
              shows a two-column DATE | VENUE table with its own labels, the long month
              shortened, and the venue split onto two lines; the desktop shows two plain
              lines with no labels. Morphing one into the other with responsive utilities
              would need the venue string both joined and split at once. `hidden` takes the
              inactive one out of the accessibility tree, so nothing is announced twice.
            */}
            <motion.div variants={item} className="order-4 mt-7 sm:order-3 sm:mt-7">
              {/* Phone: a labelled two-column footer for the title block. */}
              <div className="grid grid-cols-2 border-y border-surface/15 sm:hidden">
                <div className="py-4 pr-4">
                  <p className="text-[9px] font-bold uppercase leading-none tracking-[0.18em] text-surface/45">
                    Date
                  </p>
                  <p className="mt-2 font-sans text-[17px] font-bold uppercase leading-none text-surface">
                    {site.datesCompact}
                  </p>
                </div>
                {/* The rule is the divider — a border-l on the second cell, so it cannot
                    drift out of line with the border-y above and below it. */}
                <div className="border-l border-surface/15 py-4 pl-4">
                  <p className="text-[9px] font-bold uppercase leading-none tracking-[0.18em] text-surface/45">
                    Venue
                  </p>
                  <p className="mt-2 font-sans text-[15px] font-bold leading-tight text-surface">
                    {site.venue}
                  </p>
                  <p className="font-sans text-[13px] leading-tight text-surface/70">{site.city}</p>
                </div>
              </div>

              {/* Desktop: unchanged. */}
              <div className="hidden font-sans uppercase text-surface sm:block">
                <p className="text-lg font-bold sm:text-2xl">{site.dates}</p>
                <p className="text-sm font-light text-surface/85 sm:text-lg">
                  {site.venue} · {site.city}
                </p>
              </div>
            </motion.div>
          </motion.div>

          <LaunchPhoto />
        </div>
      </div>
    </section>
  )
}
