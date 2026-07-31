'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'

/** Counts a numeric value up when scrolled into view. Preserves prefix/suffix ("$9 Billion", "8000+"). */
export function CountUp({ value, className, duration = 1400 }: { value: string; className?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const [display, setDisplay] = useState(() => value.replace(/[\d,]+/, '0'))

  useEffect(() => {
    const match = value.match(/^(\D*)([\d,]+)(.*)$/)
    if (!match) {
      setDisplay(value)
      return
    }
    const prefix = match[1]
    const target = parseInt(match[2].replace(/,/g, ''), 10)
    const suffix = match[3]
    if (!inView) {
      setDisplay(`${prefix}0${suffix}`)
      return
    }
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(`${prefix}${Math.round(eased * target).toLocaleString()}${suffix}`)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, value, duration])

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  )
}
