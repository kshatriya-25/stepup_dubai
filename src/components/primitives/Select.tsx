'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Check, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/cn'

/** Brand-styled select. Desktop: inline dropdown. Mobile: a bottom-sheet picker
 *  that slides up, dims the page, and dismisses on select / backdrop tap. */
export function Select({
  value,
  onChange,
  options,
  label = 'Select one',
  placeholder = 'Select one',
  invalid,
}: {
  value: string
  onChange: (v: string) => void
  options: readonly string[]
  label?: string
  placeholder?: string
  invalid?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const sync = () => setIsMobile(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  // Desktop: close on outside click.
  useEffect(() => {
    if (!open || isMobile) return
    setActive(Math.max(0, options.indexOf(value)))
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open, isMobile, options, value])

  // Mobile: lock body scroll while the sheet is up.
  useEffect(() => {
    if (!open || !isMobile) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open, isMobile])

  function pick(opt: string) {
    onChange(opt)
    setOpen(false)
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'Escape') return setOpen(false)
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      return setOpen(true)
    }
    if (!open || isMobile) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(options.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      pick(options[active])
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKey}
        className={cn(
          'flex w-full items-center justify-between border bg-foam px-4 py-3 text-left text-sm outline-none transition-colors focus:bg-surface',
          invalid ? 'border-accent' : 'border-ink/15 focus:border-accent',
          value ? 'text-ink' : 'text-muted/70',
        )}
      >
        <span className="truncate">{value || placeholder}</span>
        <ChevronDown size={16} className={cn('shrink-0 text-muted transition-transform', open && 'rotate-180')} />
      </button>

      {/* Desktop inline dropdown */}
      {!isMobile && (
        <AnimatePresence>
          {open && (
            <motion.ul
              role="listbox"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.14 }}
              className="absolute z-30 mt-1 max-h-60 w-full overflow-auto border border-ink/15 bg-surface py-1 shadow-xl"
            >
              {options.map((opt, i) => (
                <li
                  key={opt}
                  role="option"
                  aria-selected={value === opt}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(opt)}
                  className={cn(
                    'flex cursor-pointer items-center justify-between px-4 py-2.5 text-sm text-ink',
                    i === active && 'bg-foam',
                    value === opt && 'font-semibold text-accent-ink',
                  )}
                >
                  {opt}
                  {value === opt && <Check size={16} className="shrink-0 text-accent" />}
                </li>
              ))}
            </motion.ul>
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
                <ul role="listbox" className="max-h-[55vh] overflow-auto border-t border-ink/10 py-1">
                  {options.map((opt) => (
                    <li
                      key={opt}
                      role="option"
                      aria-selected={value === opt}
                      onClick={() => pick(opt)}
                      className={cn(
                        'flex items-center justify-between px-5 py-3.5 text-base text-ink active:bg-foam',
                        value === opt && 'font-semibold text-accent-ink',
                      )}
                    >
                      {opt}
                      {value === opt && <Check size={18} className="shrink-0 text-accent" />}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}
