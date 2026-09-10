'use client'

import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { site } from '@/content/site'
import { partners } from '@/content/home'

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
      <div className="absolute inset-0 bg-gradient-to-r from-night/80 via-night/25 to-transparent" />

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
      <div className="relative mx-auto w-full max-w-container-wide px-4 pb-16 pt-24 sm:px-6 sm:pb-16 sm:pt-28">
        {/* Copy sits on a translucent navy panel rather than straight on the footage —
            75% of the brand navy (#072B5F), so the video still reads through it.
            Padding is the design's 60px, stepped down under 400px. */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="w-fit max-w-5xl bg-base/75 p-8 min-[400px]:p-[60px]"
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
            className="mb-8 flex flex-wrap items-start gap-x-8 gap-y-7 border-b border-surface/20 pb-7 sm:mb-9 sm:gap-x-10 sm:pb-8"
          >
            <span className="flex flex-col items-center gap-3">
              <span className="whitespace-nowrap text-[8px] font-semibold uppercase leading-none tracking-[0.14em] text-surface sm:text-[9px] sm:tracking-[0.2em]">
                Presented by
              </span>
              <span className="flex h-[72px] items-start sm:h-[108px]">
                <CreditLink name="NammaOffice" className="mt-[11px] sm:mt-[16px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/logos/nammaoffice-v3.png"
                    alt="Namma Office"
                    width={900}
                    height={154}
                    className="h-8 w-auto object-contain sm:h-[49px]"
                  />
                </CreditLink>
              </span>
            </span>

            <span className="flex flex-col items-center gap-3">
              <span className="whitespace-nowrap text-[8px] font-semibold uppercase leading-none tracking-[0.14em] text-surface sm:text-[9px] sm:tracking-[0.2em]">
                In association with
              </span>
              <span className="flex h-[72px] items-start sm:h-[108px]">
                <CreditLink name="Startup Singam">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/logos/startupsingam-reverse-v1.png"
                    alt="Startup Singam"
                    width={300}
                    height={170}
                    className="h-[72px] w-auto object-contain sm:h-[108px]"
                  />
                </CreditLink>
              </span>
            </span>

            <span className="flex flex-col items-center gap-3">
              <span className="whitespace-nowrap text-[8px] font-semibold uppercase leading-none tracking-[0.14em] text-surface sm:text-[9px] sm:tracking-[0.2em]">
                Ecosystem partner
              </span>
              <span className="flex h-[72px] items-start sm:h-[108px]">
                <CreditLink name="StartupTN" className="mt-[21px] sm:mt-[33px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/logos/startuptn-reverse-v1.png"
                    alt="StartupTN"
                    width={900}
                    height={200}
                    className="h-8 w-auto object-contain sm:h-[43px]"
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
          <motion.h1 variants={item}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/logo-v2.png"
              alt="Tier-2 Rising Startup Summit"
              width={600}
              height={386}
              className="block h-auto w-[220px] xs320:w-[250px] sm:w-[300px]"
            />
          </motion.h1>

          <motion.div variants={item} className="mt-6 font-sans uppercase text-surface sm:mt-7">
            <p className="text-lg font-bold sm:text-2xl">{site.dates}</p>
            <p className="text-sm font-light text-surface/85 sm:text-lg">
              {site.venue} · {site.city}
            </p>
          </motion.div>

          <motion.p variants={item} className="mt-4 max-w-md text-base text-surface/90 sm:text-lg">
            {site.theme}.
          </motion.p>
        </motion.div>
      </div>
    </section>
  )
}
