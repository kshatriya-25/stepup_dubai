'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Menu, X, ChevronDown, MapPin } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/cn'
import { useScrollDirection } from '@/lib/hooks'
import { nav, site } from '@/content/site'
import { WavingFlag } from './WavingFlag'
import { useParticipate } from './ParticipateModal'

export function SiteNav() {
  const { hidden } = useScrollDirection()
  const [open, setOpen] = useState(false)
  const { open: openParticipate } = useParticipate()

  /*
   * The About dropdown is STATE, not a CSS :hover trick.
   *
   * It used to be `group-hover`, which broke badly: this header hides itself on
   * scroll-down (`-translate-y-full`), and the panel is ~340px tall against an 85px
   * header — so the header would slide away while the panel, still hovered, stayed
   * on screen as an orange slab floating over the page with nothing above it.
   *
   * Pure CSS has no way to know the header left. State does, so the menu can be
   * closed by scrolling, by Escape, by clicking away, or by the header hiding — and
   * the header is pinned open while a menu is showing, so it cannot orphan the panel.
   */
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const closeTimer = useRef<number | null>(null)
  const triggerRefs = useRef<Record<string, HTMLAnchorElement | null>>({})
  /*
   * Stops Escape from immediately undoing itself.
   *
   * Escape closes the panel and returns focus to the trigger — but the trigger opens
   * the menu on focus (that is what makes it keyboard-reachable), so the close and
   * the re-open cancelled out and the panel never went away. This suppresses the
   * focus handler for exactly the one programmatic focus() that Escape performs.
   */
  const suppressFocusOpen = useRef(false)

  const cancelClose = useCallback(() => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }, [])

  const closeNow = useCallback(() => {
    cancelClose()
    setOpenMenu(null)
  }, [cancelClose])

  const openNow = useCallback(
    (label: string) => {
      cancelClose()
      setOpenMenu(label)
    },
    [cancelClose],
  )

  /*
   * A grace period on leave, not an instant close.
   *
   * The pointer travels diagonally from the trigger toward the items and clips the
   * edge of the panel on the way. Closing on the first mouseleave makes the menu feel
   * like it is running away; ~140ms is long enough to forgive the diagonal and short
   * enough that a deliberate exit still feels immediate.
   */
  const closeSoon = useCallback(() => {
    cancelClose()
    closeTimer.current = window.setTimeout(() => setOpenMenu(null), 140)
  }, [cancelClose])

  useEffect(() => cancelClose, [cancelClose])

  /*
   * Escape and outside-click dismiss it. Scroll deliberately does NOT.
   *
   * Closing on scroll was the obvious first instinct, and it was wrong: the pointer
   * is usually still resting on the trigger afterwards, and since it never left,
   * no pointerenter fires — so the menu goes dead until you move the mouse away and
   * back. Pinning the header while the menu is open (see the header className) makes
   * the panel physically unable to detach, which solves the orphan properly without
   * that dead-hover side effect.
   */
  useEffect(() => {
    if (!openMenu) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      const trigger = triggerRefs.current[openMenu]
      suppressFocusOpen.current = true
      closeNow()
      // Return focus to where it came from, or a keyboard user is dropped at the top
      // of the document with no idea where they are.
      trigger?.focus()
      window.setTimeout(() => {
        suppressFocusOpen.current = false
      }, 0)
    }
    const onPointerDown = (e: PointerEvent) => {
      if (!(e.target as HTMLElement | null)?.closest('[data-nav-item]')) closeNow()
    }

    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [openMenu, closeNow])

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 bg-base text-surface transition-transform duration-300 will-change-transform',
        // `!openMenu` pins the header while a dropdown is showing. Belt and braces
        // with the scroll handler above: even a scroll event that has not fired yet
        // cannot slide the header out from under an open panel.
        hidden && !openMenu && '-translate-y-full',
      )}
    >
      {/* Bar */}
      {/*
        FULL WIDTH, not the 1300px page container.

        The bar used to be `mx-auto max-w-container-wide`, which on anything wider than
        1300px left a band of empty navy at each end while the logo, the nav and the two
        buttons fought over the middle — worst on the widest screens, where there is the
        most room going spare. The bar is a solid navy band edge to edge, so there is no
        reason for its CONTENTS to stop short of the edges too; only the sections below,
        which sit on the page background, need the container line.

        `justify-between` then spends the reclaimed width on the gaps between the three
        groups instead of on empty margins.
      */}
      <div className="flex h-[72px] items-center justify-between px-4 sm:px-6 md:h-[85px] lg:px-8 xl:px-12">
        {/* Left: flag + wordmark + venue chip + presented-by */}
        <div className="flex items-center gap-3">
          {/* Full bar height on purpose, so the mast runs out of the bottom of the
              canvas and is cut by the header's own edge — a short pole ending in mid-air
              beside the logo reads as a floating object. Outside the logo's <a> so it
              isn't part of the "go to top" link's hit area or its accessible name.

              No left margin: the camera puts the mast a couple of pixels inside the
              canvas, so the flag starts at the bar's padding edge. `-mr-2` claws back the
              strip of empty canvas the flag leaves downwind of itself, which would
              otherwise read as a gap before the wordmark on top of the flex gap. */}
          <WavingFlag className="pointer-events-none -mr-2 h-full w-[68px] shrink-0 md:w-[88px]" />

          <a href="#top" className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {/* `-v2` is a cache-bust: the previous file misspelt RISING as "RASTING",
                and /brand/ was served `immutable`, so reusing the name would have left
                the typo on screen for anyone who had already loaded the site. */}
            <img
              src="/brand/logo-v2.png"
              alt="Tier-2 Rising Startup Summit"
              width={600}
              height={386}
              className="h-9 w-auto md:h-12"
            />
            {/* Two-line venue chip. The second line borrows its size, weight and
                colour from the "Your Co-Working Destination" strapline further along
                the bar (see the lockup below) so the header has one subordinate-label
                style rather than two that nearly match.

                `pl-4` on the second line is 12px of MapPin plus the 4px gap-1, which
                sets it flush under "Fortune City" rather than under the pin. */}
            <span className="hidden flex-col justify-center gap-[3px] border-l border-surface/25 pl-3 lg:flex">
              <span className="flex items-center gap-1 text-[11px] uppercase leading-none text-surface/70">
                <MapPin size={12} className="text-accent" /> {site.venue}
              </span>
              <span className="whitespace-nowrap pl-4 text-[7px] font-semibold uppercase leading-none tracking-[0.085em] text-surface/60 xl:text-[8px] xl:tracking-[0.1em]">
                {site.venueArea}
              </span>
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
          <span className="hidden items-center border-l border-surface/25 pl-3 lg:flex">
            {/* A three-line lockup, centred on the wordmark:
                  1  PRESENTED BY                 white @ 45%
                  2  [Namma Office wordmark]
                  3  YOUR CO-WORKING DESTINATION  white @ 60%
                The strapline is the brighter of the two labels on purpose — it is
                Namma Office's own line, while "Presented by" is only connective tissue.
                Its tracking is tuned per breakpoint so its width lands flush with the
                logo rather than overhanging it. */}
            <span className="flex flex-col items-center gap-[3px]">
              <span
                data-presented
                className="whitespace-nowrap text-[7px] font-semibold uppercase leading-none tracking-[0.2em] text-surface/45 xl:text-[8px]"
              >
                Presented By
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logos/nammaoffice-v3.png"
                alt="Namma Office"
                width={900}
                height={154}
                className="h-6 w-auto object-contain xl:h-7"
              />
              <span
                data-tagline
                className="whitespace-nowrap text-[7px] font-semibold uppercase leading-none tracking-[0.085em] text-surface/60 xl:text-[8px] xl:tracking-[0.1em]"
              >
                {site.presenterTagline}
              </span>
            </span>
          </span>
        </div>

        {/* Desktop menu */}
        {/*
          `h-full` on the nav and on each item is what makes the dropdown usable.
          Without it the trigger is only as tall as its text, so `top-full` puts the
          panel's top edge in the MIDDLE of the header bar — overlapping it, and
          leaving a dead gap between the link and the panel that closes the menu the
          moment the pointer travels down into it. Full-height triggers mean the panel
          hangs from the header's bottom edge with no gap to cross.
        */}
        {/*
          `h-full` on the nav and each item makes the trigger the full height of the
          header, so the panel hangs from the header's bottom edge (`top-full`) with
          no gap for the pointer to fall through on its way down.
        */}
        <nav className="hidden h-full items-center gap-8 md:flex">
          {nav.map((item) => {
            const isOpen = openMenu === item.label
            return (
              <div
                key={item.label}
                data-nav-item
                className="relative flex h-full items-center"
                onPointerEnter={() => item.children && openNow(item.label)}
                onPointerLeave={() => item.children && closeSoon()}
              >
                <a
                  ref={(el) => {
                    triggerRefs.current[item.label] = el
                  }}
                  href={item.href}
                  // Opening on focus is what makes the menu reachable by keyboard at
                  // all; without it Tab lands on About and the children stay hidden.
                  // The guard is for the focus() that Escape performs — see
                  // suppressFocusOpen.
                  onFocus={() => {
                    if (item.children && !suppressFocusOpen.current) openNow(item.label)
                  }}
                  onKeyDown={(e) => {
                    if (!item.children) return
                    if (e.key === 'ArrowDown') {
                      e.preventDefault()
                      openNow(item.label)
                      // Defer: the panel may still be mounting on this tick.
                      window.setTimeout(() => {
                        document
                          .querySelector<HTMLAnchorElement>(`[data-submenu="${item.label}"] a`)
                          ?.focus()
                      }, 0)
                    }
                  }}
                  // The parent still navigates on click (to #story) — the dropdown is
                  // purely additive. Clicking must not be turned into a toggle.
                  onClick={closeNow}
                  aria-expanded={item.children ? isOpen : undefined}
                  aria-haspopup={item.children ? 'true' : undefined}
                  className={cn(
                    // `text-[1rem]`, NOT `text-base`.
                    //
                    // tailwind.config.ts overrides `base` as a COLOUR (#072B5F, the navy
                    // this bar is painted in), so Tailwind emits `.text-base` twice: once
                    // as the font size we want and once as navy text. The colour rule is
                    // emitted after `.text-accent`, so it wins — and the open item's label
                    // rendered navy-on-navy and disappeared. It survived on the other
                    // items only because `.hover\:text-accent` happens to be emitted later
                    // still, so plain hover was unaffected and the bug looked like it only
                    // hit About.
                    'flex items-center gap-1 text-[1rem] font-medium transition-colors',
                    isOpen ? 'text-accent' : 'text-surface hover:text-accent',
                  )}
                >
                  {item.label}
                  {item.children && (
                    <ChevronDown
                      size={14}
                      className={cn(
                        'mt-0.5 opacity-70 transition-transform duration-200',
                        isOpen && 'rotate-180',
                      )}
                    />
                  )}
                </a>

                {item.children && (
                  <div
                    data-submenu={item.label}
                    // Kept mounted and hidden rather than unmounted, so the fade can
                    // play on the way out instead of the panel vanishing mid-gesture.
                    className={cn(
                      'absolute left-0 top-full min-w-[240px] origin-top overflow-hidden',
                      'border-t-2 border-accent bg-base shadow-2xl',
                      'transition-all duration-150 ease-out',
                      isOpen
                        ? 'visible translate-y-0 opacity-100'
                        : 'invisible -translate-y-1 opacity-0',
                    )}
                  >
                    <div className="py-1.5">
                      {item.children.map((c) => (
                        <a
                          key={c.label}
                          href={c.href}
                          onClick={closeNow}
                          className={cn(
                            'block whitespace-nowrap border-l-2 border-transparent px-5 py-2.5',
                            'text-sm font-medium text-surface/85 transition-colors duration-100',
                            'hover:border-accent hover:bg-base-2 hover:text-surface',
                            'focus-visible:border-accent focus-visible:bg-base-2 focus-visible:text-surface focus-visible:outline-none',
                          )}
                        >
                          {c.label}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
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
