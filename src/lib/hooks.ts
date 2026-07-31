'use client'

import { useEffect, useRef, useState } from 'react'

/** Nav behaviour from the original app.js: colored @40px, hide-on-down / show-on-up past 500px. */
export function useScrollDirection() {
  const [state, setState] = useState({ atTop: true, hidden: false })
  const lastY = useRef(0)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      const goingDown = y > lastY.current
      setState({
        atTop: y < 40,
        hidden: goingDown && y >= 500,
      })
      lastY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return state
}

/** Sticky-to-bottom promo bar: stick after scrolling, hide when near the footer. */
export function useStickyBottom() {
  const [state, setState] = useState({ stick: false, hidden: false })
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      const nearBottom = window.innerHeight + y >= document.body.offsetHeight - 200
      setState({ stick: y > 600, hidden: nearBottom })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return state
}

export type TimeLeft = { days: number; hours: number; minutes: number; seconds: number; done: boolean }

export function useCountdown(targetISO: string): TimeLeft {
  const target = new Date(targetISO).getTime()
  const [left, setLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0, done: false })

  useEffect(() => {
    const tick = () => {
      const distance = target - Date.now()
      if (distance <= 0) {
        setLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, done: true })
        return
      }
      setLeft({
        days: Math.floor(distance / 86400000),
        hours: Math.floor((distance % 86400000) / 3600000),
        minutes: Math.floor((distance % 3600000) / 60000),
        seconds: Math.floor((distance % 60000) / 1000),
        done: false,
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [target])

  return left
}
