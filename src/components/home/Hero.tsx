'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/primitives/Button'
import { useParticipate } from '@/components/shell/ParticipateModal'
import { site } from '@/content/site'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
}
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
}

export function Hero() {
  const { open } = useParticipate()
  return (
    <section className="relative overflow-hidden pt-[72px] md:pt-[85px]">
      {/* hero background — Salem aerial loop (client footage) */}
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
      {/* lighter wash — dark enough behind the card, footage stays visible on the right */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

      <div className="relative mx-auto max-w-container-wide px-4 py-16 sm:px-6 md:py-32">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="max-w-[600px] bg-black/60 p-8 backdrop-blur-md sm:p-10"
        >
          <motion.p
            variants={item}
            className="mb-5 inline-flex items-center gap-2 bg-accent px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-accent-ink"
          >
            {site.initiativeBy} · {site.season}
          </motion.p>

          <motion.h1
            variants={item}
            className="font-sans text-5xl font-bold uppercase leading-[0.98] tracking-[-0.015em] text-surface sm:text-7xl"
          >
            Tier-2 <span className="text-accent">Rising</span>
          </motion.h1>
          <motion.p
            variants={item}
            className="mt-2 font-sans text-2xl font-semibold uppercase tracking-[0.02em] text-surface sm:text-3xl"
          >
            {site.subhead}
          </motion.p>

          <motion.p variants={item} className="mt-5 max-w-md text-lg text-surface/85">
            {site.theme}.
          </motion.p>

          <motion.div variants={item} className="mt-5 font-sans uppercase text-surface">
            <p className="text-2xl font-semibold">{site.dates}</p>
            <p className="text-lg font-light text-surface/80">
              {site.venue} · {site.city}
            </p>
          </motion.div>

          <motion.div variants={item} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button href={site.register} variant="solid">Register Free</Button>
            <Button onClick={open} variant="outline">Nominate a Startup</Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
