'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Check, X, Search } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/cn'

/** Searchable select. Desktop: dropdown with a search box. Mobile: bottom-sheet
 *  picker with a search box that slides up and dismisses on select. */
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
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const sync = () => setIsMobile(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? options.filter((o) => o.toLowerCase().includes(q)) : options
  }, [query, options])

  useEffect(() => setActive(0), [query])

  // Desktop: close on outside click.
  useEffect(() => {
    if (!open || isMobile) return
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open, isMobile])

  // Focus the search box on open; lock body scroll on mobile.
  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => inputRef.current?.focus(), 60)
    if (!isMobile) return () => clearTimeout(t)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      clearTimeout(t)
      document.body.style.overflow = prev
    }
  }, [open, isMobile])

  function pick(opt: string) {
    onChange(opt)
    setOpen(false)
    setQuery('')
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
        className="w-full bg-transparent py-3 text-sm text-ink outline-none placeholder:text-muted/70"
      />
    </div>
  )

  const optionList = (big: boolean) => (
    <ul role="listbox" className={cn('overflow-auto', big ? 'max-h-[50vh]' : 'max-h-56')}>
      {filtered.length === 0 && <li className="px-4 py-3 text-sm text-muted">No matches</li>}
      {filtered.map((opt, i) => (
        <li
          key={opt}
          role="option"
          aria-selected={value === opt}
          onMouseEnter={() => setActive(i)}
          onClick={() => pick(opt)}
          className={cn(
            'flex cursor-pointer items-center justify-between px-4 text-ink',
            big ? 'py-3.5 text-base' : 'py-2.5 text-sm',
            i === active && 'bg-foam',
            value === opt && 'font-semibold text-accent-ink',
          )}
        >
          {opt}
          {value === opt && <Check size={16} className="shrink-0 text-accent" />}
        </li>
      ))}
    </ul>
  )

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          setQuery('')
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

      {/* Desktop dropdown */}
      {!isMobile && (
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.14 }}
              className="absolute z-30 mt-1 w-full border border-ink/15 bg-surface shadow-xl"
            >
              {searchBox}
              {optionList(false)}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Mobile bottom sheet */}
      {isMobile && (
        <AnimatePresence>
          {open && (
            <motion.div
              className="fixed inset-0 z-[120] flex items-end"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="absolute inset-0 bg-night/60" onClick={() => setOpen(false)} />
              <motion.div
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
                  <button
                    type="button"
                    aria-label="Close"
                    onClick={() => setOpen(false)}
                    className="-mr-1 p-1 text-muted"
                  >
                    <X size={20} />
                  </button>
                </div>
                {searchBox}
                {optionList(true)}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}
