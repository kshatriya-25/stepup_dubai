'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Check, X, Search } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/cn'

/**
 * Searchable select. Desktop: dropdown anchored to the trigger. Mobile: bottom sheet.
 *
 * BOTH PANELS ARE PORTALLED TO document.body, and that is not optional. The register
 * section is `relative overflow-hidden` (it clips a decorative blur), and the form card
 * sits inside a framer-motion <Reveal> whose transform makes it a containing block even
 * for `position: fixed`. An in-tree panel therefore gets clipped the moment it is taller
 * than the space left below the trigger — the user clicks, the panel renders, and
 * nothing visibly happens. Portalling puts it outside every clipping ancestor.
 */
export function Combobox({
  value,
  onChange,
  options,
  label = 'Select',
  placeholder = 'Select',
  searchPlaceholder = 'Type to search…',
  invalid,
}: {
  value: string
  onChange: (v: string) => void
  options: readonly string[]
  label?: string
  placeholder?: string
  searchPlaceholder?: string
  invalid?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [anchor, setAnchor] = useState<Anchor | null>(null)

  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  // Portals need a DOM to target, which does not exist during SSR.
  useEffect(() => setMounted(true), [])

  // 767px, not 639px: this project overrides Tailwind's breakpoints and `sm` is 768px
  // (tailwind.config.ts). The old 639px left 640–767px devices on the desktop dropdown.
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const sync = () => setIsMobile(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? options.filter((o) => o.toLowerCase().includes(q)) : options
  }, [query, options])

  // Keep the highlight on the current value when reopening; reset it while searching.
  useEffect(() => {
    if (!open) return
    const i = filtered.indexOf(value)
    setActive(i >= 0 ? i : 0)
  }, [open, value, filtered])
  useEffect(() => setActive(0), [query])

  /** Measure the trigger so the desktop panel can be positioned against it. */
  const measure = useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    setAnchor(anchorFor(el))
  }, [])

  useLayoutEffect(() => {
    if (!open || isMobile) return
    measure()
    // `true` captures scrolls on any ancestor, not just the window.
    window.addEventListener('scroll', measure, true)
    window.addEventListener('resize', measure)
    return () => {
      window.removeEventListener('scroll', measure, true)
      window.removeEventListener('resize', measure)
    }
  }, [open, isMobile, measure])

  // Close on outside click. The panel is portalled, so it is NOT inside the trigger's
  // subtree — both refs have to be checked or the first click would close it again.
  useEffect(() => {
    if (!open || isMobile) return
    function onDoc(e: MouseEvent) {
      const t = e.target as Node
      if (triggerRef.current?.contains(t) || panelRef.current?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open, isMobile])

  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => inputRef.current?.focus(), 60)
    return () => clearTimeout(t)
  }, [open])

  // Mobile scroll lock. Plain `overflow: hidden` on the body loses the scroll position
  // on iOS, so the page jumps to the top behind the sheet — which reads as the form
  // having thrown the user somewhere random. Pin the body instead and restore after.
  useEffect(() => {
    if (!open || !isMobile) return
    const y = window.scrollY
    const s = document.body.style
    const prev = { position: s.position, top: s.top, width: s.width, overflow: s.overflow }
    s.position = 'fixed'
    s.top = `-${y}px`
    s.width = '100%'
    s.overflow = 'hidden'
    return () => {
      s.position = prev.position
      s.top = prev.top
      s.width = prev.width
      s.overflow = prev.overflow
      window.scrollTo(0, y)
    }
  }, [open, isMobile])

  // Keep the keyboard-highlighted option visible.
  useEffect(() => {
    if (!open) return
    listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' })
  }, [active, open])

  function pick(opt: string) {
    onChange(opt)
    setOpen(false)
    setQuery('')
    // Return focus so the next Tab continues through the form rather than restarting.
    triggerRef.current?.focus()
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(filtered.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[active]) pick(filtered[active])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
      triggerRef.current?.focus()
    } else if (e.key === 'Tab') {
      setOpen(false)
    }
  }

  const searchBox = (
    <div className="flex items-center gap-2 border-b border-ink/10 px-3">
      <Search size={16} className="shrink-0 text-muted" />
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={onKey}
        placeholder={searchPlaceholder}
        aria-label={searchPlaceholder}
        className="w-full bg-transparent py-3 text-sm text-ink outline-none placeholder:text-muted/70"
      />
    </div>
  )

  const optionList = (big: boolean, maxHeight?: number) => (
    <ul
      ref={listRef}
      role="listbox"
      aria-label={label}
      className="overflow-y-auto overscroll-contain"
      style={{ maxHeight: maxHeight ?? (big ? '55vh' : 224) }}
    >
      {filtered.length === 0 && (
        <li className="px-4 py-3 text-sm text-muted">No matches for &ldquo;{query.trim()}&rdquo;</li>
      )}
      {filtered.map((opt, i) => (
        <li
          key={opt}
          role="option"
          aria-selected={value === opt}
          onMouseEnter={() => setActive(i)}
          onClick={() => pick(opt)}
          className={cn(
            'flex cursor-pointer items-center justify-between px-4 text-ink',
            // 44px min touch target on mobile — the old py-3.5 rows were fiddly to hit.
            big ? 'min-h-[48px] py-3 text-base' : 'py-2.5 text-sm',
            i === active && 'bg-foam',
            value === opt && 'font-semibold text-accent-ink',
          )}
        >
          <span className="pr-3">{opt}</span>
          {value === opt && <Check size={16} className="shrink-0 text-accent" />}
        </li>
      ))}
    </ul>
  )

  const desktopPanel = anchor && (
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, y: anchor.flipUp ? 4 : -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: anchor.flipUp ? 4 : -4 }}
      transition={{ duration: 0.14 }}
      style={{
        position: 'fixed',
        left: anchor.left,
        width: anchor.width,
        ...(anchor.flipUp ? { bottom: anchor.bottom } : { top: anchor.top }),
      }}
      className="z-[140] border border-ink/15 bg-surface shadow-xl"
    >
      {searchBox}
      {optionList(false, anchor.maxHeight)}
    </motion.div>
  )

  const mobilePanel = (
    <motion.div
      className="fixed inset-0 z-[140] flex items-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-night/60" onClick={() => setOpen(false)} />
      <motion.div
        ref={panelRef}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
        className="relative z-10 w-full rounded-t-2xl bg-surface pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-2xl"
      >
        <div className="flex justify-center pt-3">
          <span className="h-1.5 w-10 rounded-full bg-ink/15" />
        </div>
        <div className="flex items-center justify-between px-5 py-3">
          <span className="font-sans text-sm font-bold uppercase tracking-[0.12em] text-ink">{label}</span>
          <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="-mr-1 p-1 text-muted">
            <X size={20} />
          </button>
        </div>
        {searchBox}
        {optionList(true)}
      </motion.div>
    </motion.div>
  )

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          setQuery('')
          if (!open) measure()
          setOpen((o) => !o)
        }}
        className={cn(
          'flex w-full items-center justify-between border bg-foam px-4 py-3 text-left text-sm outline-none transition-colors focus:bg-surface',
          invalid ? 'border-accent' : 'border-ink/15 focus:border-accent',
          value ? 'text-ink' : 'text-muted/70',
        )}
      >
        <span className="truncate">{value || placeholder}</span>
        <ChevronDown size={16} className={cn('shrink-0 text-muted transition-transform', open && 'rotate-180')} />
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>{open && (isMobile ? mobilePanel : desktopPanel)}</AnimatePresence>,
          document.body,
        )}
    </div>
  )
}

type Anchor = { left: number; width: number; top: number; bottom: number; maxHeight: number; flipUp: boolean }

/** Position the panel below the trigger, or above it when there isn't room. */
function anchorFor(el: HTMLElement): Anchor {
  const r = el.getBoundingClientRect()
  const GAP = 4
  const MAX = 300
  const below = window.innerHeight - r.bottom - GAP
  const above = r.top - GAP
  const flipUp = below < 200 && above > below
  const space = flipUp ? above : below
  return {
    left: r.left,
    width: r.width,
    top: r.bottom + GAP,
    bottom: window.innerHeight - r.top + GAP,
    // Subtract the search box so the list itself never pushes the panel off-screen.
    maxHeight: Math.max(120, Math.min(MAX, space) - 48),
    flipUp,
  }
}
