'use client'

import { useState } from 'react'
import { Menu, X, ChevronDown, MapPin } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/cn'
import { useScrollDirection } from '@/lib/hooks'
import { nav, site } from '@/content/site'
import { useParticipate } from './ParticipateModal'

export function SiteNav() {
  const { hidden } = useScrollDirection()
  const [open, setOpen] = useState(false)
  const { open: openParticipate } = useParticipate()

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 bg-base text-surface transition-transform duration-300 will-change-transform',
        hidden && '-translate-y-full',
      )}
    >
      {/* Bar */}
      <div className="mx-auto flex h-[72px] max-w-container-wide items-center justify-between px-4 sm:px-6 md:h-[85px]">
        {/* Left: wordmark + venue chip + presented-by */}
        <div className="flex items-center gap-3">
          <a href="#top" className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo.png" alt="Tier-2 Rising Startup Summit" className="h-9 w-auto md:h-12" />
            <span className="hidden items-center gap-1 border-l border-surface/25 pl-3 text-[11px] uppercase text-surface/70 lg:flex">
              <MapPin size={12} className="text-accent" /> {site.venue}
            </span>
          </a>
          {/*
            Was `xl:flex`, which in this project means 1600px (tailwind.config.ts
            overrides the default breakpoints) — so the credit was invisible on every
            normal laptop and only appeared on very wide monitors. Now matches the
            venue chip's `lg` (1200px).

            The asset is the official transparent wordmark supplied by Namma Office, so
            it sits straight on the navy with no white box behind it.

            The `-v3` in the filename is a cache-bust, not decoration. Apache served
            /logos/ with `Cache-Control: immutable`, so browsers that already fetched an
            older version would never re-request the same URL. Replacing an image under
            this path means giving it a NEW name. (The header has since been relaxed to
            a day + stale-while-revalidate; see deploy/.)
          */}
          <span className="hidden items-center gap-2.5 border-l border-surface/25 pl-3 lg:flex">
            <span className="whitespace-nowrap text-[10px] font-semibold uppercase leading-tight tracking-[0.12em] text-surface/60">
              Presented
              <br />
              by
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logos/nammaoffice-v3.png"
              alt="Namma Office"
              width={900}
              height={154}
              className="h-6 w-auto object-contain xl:h-7"
            />
          </span>
        </div>

        {/* Desktop menu */}
        <nav className="hidden items-center gap-8 md:flex">
          {nav.map((item) => (
            <div key={item.label} className="group relative">
              <a
                href={item.href}
                className="flex items-center gap-1 text-base font-medium text-surface transition-colors hover:text-accent"
              >
                {item.label}
                {item.children && <ChevronDown size={14} className="mt-0.5 opacity-70" />}
              </a>
              {item.children && (
                <div className="invisible absolute left-0 top-full min-w-[220px] opacity-0 transition-opacity group-hover:visible group-hover:opacity-100">
                  <div className="mt-0 bg-accent py-1">
                    {item.children.map((c) => (
                      <a
                        key={c.label}
                        href={c.href}
                        className="block px-5 py-2.5 text-sm font-medium text-accent-ink hover:bg-base hover:text-surface"
                      >
                        {c.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Right CTAs */}
        <div className="hidden items-center gap-3 md:flex">
          <button onClick={openParticipate} className="text-btn font-bold uppercase text-accent hover:text-surface">
            Participate
          </button>
          <a
            href={site.register}
            className="bg-accent px-6 py-3 text-btn font-bold uppercase text-accent-ink hover:bg-surface"
          >
            Register
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          className="text-accent md:hidden"
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile panel */}
      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.77, 0.2, 0.05, 1] }}
            className="absolute inset-x-0 top-full h-[calc(100dvh-72px)] overflow-y-auto bg-base md:hidden"
          >
            <div className="flex flex-col divide-y divide-surface/10 px-4 pb-10 pt-2">
              {nav.map((item) => (
                <div key={item.label} className="py-1">
                  <a
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block py-3 text-xl font-semibold uppercase text-surface"
                  >
                    {item.label}
                  </a>
                  {item.children?.map((c) => (
                    <a
                      key={c.label}
                      href={c.href}
                      onClick={() => setOpen(false)}
                      className="block py-2 pl-4 text-base text-surface/70"
                    >
                      {c.label}
                    </a>
                  ))}
                </div>
              ))}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setOpen(false)
                    openParticipate()
                  }}
                  className="flex-1 border border-accent py-3 text-btn font-bold uppercase text-accent"
                >
                  Participate
                </button>
                <a
                  href={site.register}
                  onClick={() => setOpen(false)}
                  className="flex-1 bg-accent py-3 text-center text-btn font-bold uppercase text-accent-ink"
                >
                  Register
                </a>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
