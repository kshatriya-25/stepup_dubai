'use client'

import { useEffect, useRef, useState } from 'react'

import type { FlagScene } from '@/lib/flag/scene'

/**
 * The waving tricolour beside the hero copy.
 *
 * Decorative, and treated as such throughout: it is hidden from assistive technology,
 * and every path that would make it a cost rather than a flourish opts out entirely
 * rather than degrading.
 *
 *   - Below 1200px it never mounts. The hero copy panel takes the full width there, so
 *     there is no space for a mast, and small screens are exactly where a WebGL cloth
 *     simulation running beside an autoplaying video hurts most.
 *   - With `prefers-reduced-motion: reduce` the scene is built and settled but the loop
 *     never starts, so the visitor sees a still flag mid-wave instead of nothing.
 *   - Off screen or in a background tab, the loop stops. Scrolled past the hero, this
 *     costs nothing.
 *   - No WebGL, or a lost context, and it silently renders nothing.
 *
 * three.js is behind a dynamic import inside the effect, so the ~150KB never enters the
 * main bundle and is not even fetched by anyone the rules above have already excluded.
 */
export function WavingFlag({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [visible, setVisible] = useState(false)

  // Gate on viewport width before anything else, so narrow screens never pay for the
  // import. Kept in state (not just a CSS class) because a hidden canvas would still
  // download and run the simulation.
  useEffect(() => {
    const query = window.matchMedia('(min-width: 1200px)')
    const sync = () => setVisible(query.matches)

    sync()
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!visible || !canvas) return

    let scene: FlagScene | null = null
    let cancelled = false

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let observer: IntersectionObserver | null = null
    let resizeObserver: ResizeObserver | null = null
    let onVisibilityChange: (() => void) | null = null

    import('@/lib/flag/scene')
      .then(({ createFlagScene }) => {
        // The effect may have been torn down while the chunk was in flight — React
        // StrictMode does exactly this on every mount in development.
        if (cancelled) return

        scene = createFlagScene(canvas)
        if (!scene) return

        const active = scene

        // The canvas is sized by CSS; this keeps the drawing buffer and the camera
        // framing in step with it without listening to window resize. Set up even for
        // reduced motion, where nothing else would ever redraw after a resize.
        resizeObserver = new ResizeObserver(() => active.resize())
        resizeObserver.observe(canvas)

        // createFlagScene has already drawn a settled still frame, so reduced motion
        // needs nothing further than never starting the loop.
        if (reducedMotion) return

        let onScreen = false

        const sync = () => {
          if (onScreen && document.visibilityState === 'visible') active.start()
          else active.stop()
        }

        observer = new IntersectionObserver(
          (entries) => {
            onScreen = entries[0]?.isIntersecting ?? false
            sync()
          },
          { threshold: 0 },
        )
        observer.observe(canvas)

        onVisibilityChange = sync
        document.addEventListener('visibilitychange', onVisibilityChange)
      })
      .catch(() => {
        /* Chunk failed to load. Decorative — carry on without it. */
      })

    return () => {
      cancelled = true
      observer?.disconnect()
      resizeObserver?.disconnect()
      if (onVisibilityChange) document.removeEventListener('visibilitychange', onVisibilityChange)
      scene?.dispose()
    }
  }, [visible])

  if (!visible) return null

  return <canvas ref={canvasRef} aria-hidden className={className} />
}
