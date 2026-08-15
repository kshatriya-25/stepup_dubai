'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/primitives/Button'
import { WavingFlag } from '@/components/home/WavingFlag'
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

      {/* Waving tricolour in the open half of the frame, right of the copy panel.
          Sits above the washes so it isn't dulled by them, below the copy so it can
          never sit over text. Renders nothing under 1200px — see the component. */}
      <WavingFlag className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] max-w-[620px] lg:block" />

      <div className="relative mx-auto w-full max-w-container-wide px-4 pb-16 pt-28 sm:px-6 sm:pt-24">
        {/* Copy sits on a translucent navy panel rather than straight on the footage —
            75% of the brand navy (#072B5F), so the video still reads through it.
            Padding is the design's 60px, stepped down under 400px where 120px of
            horizontal padding would leave "TIER-2" at text-5xl wider than the line box
            it has to fit in. */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="max-w-2xl bg-base/75 p-8 min-[400px]:p-[60px]"
        >
          <motion.p variants={item} className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-accent sm:mb-4 sm:text-sm">
            {site.initiativeBy} · {site.season}
          </motion.p>

          <motion.h1
            variants={item}
            className="font-sans text-5xl font-bold uppercase leading-[0.92] tracking-[-0.02em] text-surface xs320:text-6xl sm:text-8xl"
          >
            Tier-2 <span className="text-accent">Rising</span>
          </motion.h1>
          <motion.p
            variants={item}
            className="mt-1 font-sans text-xl font-semibold uppercase tracking-[0.04em] text-surface sm:text-4xl"
          >
            {site.subhead}
          </motion.p>

          <motion.div variants={item} className="mt-5 font-sans uppercase text-surface sm:mt-6">
            <p className="text-lg font-bold sm:text-2xl">{site.dates}</p>
            <p className="text-sm font-light text-surface/85 sm:text-lg">
              {site.venue} · {site.city}
            </p>
          </motion.div>

          <motion.p variants={item} className="mt-4 max-w-md text-base text-surface/90 sm:text-lg">
            {site.theme}.
          </motion.p>

          <motion.div variants={item} className="mt-7 sm:mt-8">
            <Button href={site.register} variant="solid" full className="py-4 sm:w-auto">
              Register
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
