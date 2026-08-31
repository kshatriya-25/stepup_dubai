'use client'

import { motion } from 'framer-motion'
import { site } from '@/content/site'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } } }
const item = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
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
          className="max-w-3xl bg-base/75 p-8 min-[400px]:p-[60px]"
        >
          {/*
            PRESENTER CREDITS, as marks rather than as words, and they OPEN the panel.

            They were at the foot of it, under the tagline, which is the conventional place
            for a credit and the wrong one here: these two are why the summit exists, and a
            reader who has to get past the whole panel to find out who is behind it has
            already decided whether to trust the page. They also used to be in the header —
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

            SIZED TO A MATCHING CAP HEIGHT, NOT A MATCHING BOX. Namma Office is a 5.8:1
            wordmark and Startup Singam is a 1.76:1 stacked mark, so equal heights would
            have made the Tamil line look like the junior partner by a wide margin —
            h-9/h-14 against h-14/h-20 is what lands their letterforms at the same optical
            size.

            THE PANEL IS THE CEILING. At sm the content box is 552px, and this row measures
            327px of Namma Office plus a 48px gap plus a 141px Startup Singam column — 516,
            with 36px to spare. That is why the labels step DOWN to 9px as the marks grow:
            at 10px "IN ASSOCIATION WITH" is 153px, wider than the logo beneath it, and the
            column would be sized by its caption instead of by the thing it captions. Going
            larger than this needs the arithmetic redone, not a bigger number — though the
            row does wrap rather than overflow if it is ever wrong.

            The logos sit in a FIXED-HEIGHT row rather than following their own heights.
            Two columns of different total height cannot be aligned at both ends: aligning
            the bottoms throws the two labels onto different lines, and aligning the tops
            does the reverse. Giving the row the height of the taller mark makes the columns
            equal, so the labels share a line whatever either asset's proportions are.

            `items-start` INSIDE that row, with the Namma mark nudged down by an explicit
            margin. Neither flex value alone lands it where it belongs:

              items-center  drops it 33px, centring the BOX. Too low — it opened a gap
                            under "Presented by" while Startup Singam sat tight under its
                            own label.
              items-start   hangs it at 0. Too high — it floats above the mark beside it.

            18px is where the two logos' INK centres agree, and that is the alignment the
            eye actually judges. It is not the midpoint of either box: the Namma file spikes
            a trident above the wordmark, so its letterforms centre at 70.8% of its height
            rather than 50%, and the Startup Singam file carries slack at the bottom, so its
            artwork centres at 47.1%. Aligning the boxes would have been wrong by 15px.

              mt = 120 x 0.471 - 54 x 0.708 = 18.2   (sm)
              mt =  72 x 0.471 - 32 x 0.708 = 11.2   (mobile)

            Re-derive these if either logo's height changes; they are not round numbers and
            they are not padding.

            `items-start` on each column is load-bearing, not tidiness. A flex column
            stretches its children across the cross axis by default, and an <img> with
            `w-auto` stretches with it — then `object-contain` letterboxes the artwork and
            CENTRES it in a box as wide as the column. Namma Office is the widest thing in
            its column so nothing showed; Startup Singam is narrower than its own label, so
            its logo sat indented from the label above it.
          */}
          <motion.div
            variants={item}
            className="mb-8 flex flex-wrap items-start gap-x-8 gap-y-7 border-b border-surface/20 pb-7 sm:mb-9 sm:gap-x-10 sm:pb-8"
          >
            <span className="flex flex-col items-center gap-3">
              <span className="whitespace-nowrap text-[8px] font-semibold uppercase leading-none tracking-[0.14em] text-surface sm:text-[9px] sm:tracking-[0.2em]">
                Presented by
              </span>
              <span className="flex h-[72px] items-start sm:h-[120px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logos/nammaoffice-v3.png"
                  alt="Namma Office"
                  width={900}
                  height={154}
                  className="mt-[11px] h-8 w-auto object-contain sm:mt-[18px] sm:h-[54px]"
                />
              </span>
            </span>

            <span className="flex flex-col items-center gap-3">
              <span className="whitespace-nowrap text-[8px] font-semibold uppercase leading-none tracking-[0.14em] text-surface sm:text-[9px] sm:tracking-[0.2em]">
                In association with
              </span>
              <span className="flex h-[72px] items-start sm:h-[120px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logos/startupsingam-reverse-v1.png"
                  alt="Startup Singam"
                  width={300}
                  height={170}
                  className="h-[72px] w-auto object-contain sm:h-[120px]"
                />
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
            breakpoints; the width is what has to stay inside the panel's 552px of content
            box at p-[60px]. 300px is a little over half of that — the reduction the client
            asked for, and it leaves the partner marks above it room to be large enough to
            recognise, which was the point of moving them here.
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
