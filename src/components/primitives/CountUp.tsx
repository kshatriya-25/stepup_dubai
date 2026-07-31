'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'

/** Counts a numeric value up when scrolled into view. Preserves prefix/suffix (e.g. "$9 Billion", "8000+"). */
export function CountUp({ value, className, duration = 1400 }: { value: string; className?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const [display, setDisplay] = useState('0')

  const m = value.match(/^(\D*)([\d,]+)(.*)$/)
  const prefix = m ? m[1] : ''
  const target = m ? parseInt(m[2].replace(/,/g, ''), 10) : 0
  const suffix = m ? m[3] : value

  useEffect(() => {
    if (!inView || !m) {
      if (!m) setDisplay(value)
      return
    }
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(Math.round(eased * target).toLocaleString())
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, target, duration, m, value])

  return (
    <span ref={ref} className={className}>
      {m ? `${prefix}${display}${suffix}` : value}
    </span>
  )
}
