'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/primitives/Button'
import { useParticipate } from '@/components/shell/ParticipateModal'
import { site } from '@/content/site'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } } }
const item = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
}

export function Hero() {
  const { open } = useParticipate()
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
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/40" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/20 to-transparent" />

      <div className="relative mx-auto w-full max-w-container-wide px-4 pt-24 sm:px-6">
        <motion.div variants={container} initial="hidden" animate="show" className="max-w-2xl">
          <motion.p variants={item} className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-accent sm:text-sm">
            {site.initiativeBy} · {site.season}
          </motion.p>

          <motion.h1
            variants={item}
            className="font-sans text-6xl font-bold uppercase leading-[0.92] tracking-[-0.02em] text-surface sm:text-8xl"
          >
            Tier-2 <span className="text-accent">Rising</span>
          </motion.h1>
          <motion.p
            variants={item}
            className="mt-1 font-sans text-2xl font-semibold uppercase tracking-[0.04em] text-surface sm:text-4xl"
          >
            {site.subhead}
          </motion.p>

          <motion.div variants={item} className="mt-6 font-sans uppercase text-surface">
            <p className="text-xl font-bold sm:text-2xl">{site.dates}</p>
            <p className="text-base font-light text-surface/85 sm:text-lg">
              {site.venue} · {site.city}
            </p>
          </motion.div>

          <motion.p variants={item} className="mt-4 max-w-md text-lg text-surface/90">
            {site.theme}.
          </motion.p>

          <motion.div variants={item} className="mt-8 flex max-w-md flex-col gap-3">
            <Button href={site.register} variant="solid" full className="justify-center py-4 text-lg">
              Register Free
            </Button>
            <Button onClick={open} variant="solid" full className="justify-center py-4 text-lg">
              Nominate a Startup
            </Button>
            <button
              onClick={open}
              className="w-full border border-surface/40 bg-black/30 px-7 py-4 text-lg font-bold uppercase text-surface backdrop-blur-sm transition-colors hover:bg-accent hover:text-accent-ink hover:border-accent"
            >
              Partner &amp; Sponsor
            </button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
