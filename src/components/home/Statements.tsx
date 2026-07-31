'use client'

import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { statements } from '@/content/home'
import { cn } from '@/lib/cn'

export function Statements() {
  const [emblaRef, embla] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 4000, stopOnInteraction: false })])
  const [selected, setSelected] = useState(0)

  const onSelect = useCallback(() => {
    if (embla) setSelected(embla.selectedScrollSnap())
  }, [embla])

  useEffect(() => {
    if (!embla) return
    onSelect()
    embla.on('select', onSelect)
    return () => {
      embla.off('select', onSelect)
    }
  }, [embla, onSelect])

  return (
    <section
      className="text-surface"
      style={{ background: 'radial-gradient(60% 60% at 50% 50%, #0A356F 0%, #072B5F 100%)' }}
    >
      <div className="mx-auto max-w-container px-6 py-20 md:py-28">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {statements.map((s) => (
              <div key={s.text} className="min-w-0 flex-[0_0_100%] px-2">
                <p className="max-w-3xl font-sans text-3xl font-bold leading-tight text-surface md:text-5xl">
                  {s.text}
                </p>
                <p className="mt-6 text-lg font-bold uppercase tracking-widest text-accent">{s.author}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex gap-2">
          {statements.map((s, i) => (
            <button
              key={s.text}
              aria-label={`Go to statement ${i + 1}`}
              onClick={() => embla?.scrollTo(i)}
              className={cn('h-2.5 w-2.5 rounded-full border border-surface/60', selected === i && 'bg-surface')}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
