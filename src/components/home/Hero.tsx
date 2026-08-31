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

        pb comes DOWN as pt goes up, on purpose. The offset only needs the gap between
        them, so paying for it with pt alone would have added 80px to the section's total
        height and pushed the new credits below the fold on a 13" laptop, where the hero
        already overflows min-h-screen and `items-center` stops centring anything.
      */}
      <div className="relative mx-auto w-full max-w-container-wide px-4 pb-16 pt-32 sm:px-6 sm:pb-12 sm:pt-40">
        {/* Copy sits on a translucent navy panel rather than straight on the footage —
            75% of the brand navy (#072B5F), so the video still reads through it.
            Padding is the design's 60px, stepped down under 400px. */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="max-w-2xl bg-base/75 p-8 min-[400px]:p-[60px]"
        >
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
            asked for, with room for the credits added below.
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

          {/*
            PRESENTER CREDITS, as marks rather than as words.

            This block replaces two things at once: the Register button that stood here,
            and the "{initiativeBy} · {season}" eyebrow that used to open the panel. The
            eyebrow said "NammaOffice Presents · In association with Startup Singam" —
            word for word what these two labels say — so keeping it would have printed the
            same credit twice within one panel.

            Startup Singam uses the -reverse asset, not the file the light sections use.
            The supplied mark is dark blue type flattened onto white; dropped straight onto
            this navy it is unreadable, which is why the header used to give it a white
            chip. See scripts/startupsingam-reverse.py.

            The two are sized to a MATCHING CAP HEIGHT rather than a matching box. Namma
            Office is a 5.8:1 wordmark and Startup Singam is a 1.76:1 stacked mark, so
            equal heights would have made the Tamil line look like the junior partner by a
            wide margin — h-6/h-7 against h-10/h-11 is what lands their letterforms at the
            same optical size.
          */}
          <motion.div
            variants={item}
            className="mt-8 flex flex-wrap items-end gap-x-8 gap-y-6 border-t border-surface/20 pt-6 sm:mt-9 sm:gap-x-12 sm:pt-7"
          >
            <span className="flex flex-col gap-2.5">
              <span className="whitespace-nowrap text-[9px] font-semibold uppercase leading-none tracking-[0.2em] text-surface/50">
                Presented by
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logos/nammaoffice-v3.png"
                alt="Namma Office"
                width={900}
                height={154}
                className="h-6 w-auto object-contain sm:h-7"
              />
            </span>

            <span className="flex flex-col gap-2.5">
              <span className="whitespace-nowrap text-[9px] font-semibold uppercase leading-none tracking-[0.16em] text-surface/50">
                In association with
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logos/startupsingam-reverse-v1.png"
                alt="Startup Singam"
                width={300}
                height={170}
                className="h-10 w-auto object-contain sm:h-11"
              />
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
