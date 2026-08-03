'use client'

import { useCountdown } from '@/lib/hooks'
import { site } from '@/content/site'

const units = ['Days', 'Hrs', 'Min', 'Sec'] as const

export function CountdownBar() {
  const t = useCountdown(site.startISO)
  const values = [t.days, t.hours, t.minutes, t.seconds]

  return (
    <div className="w-full border-y border-ink/10 bg-surface">
      <div className="mx-auto flex max-w-container-wide flex-wrap items-center justify-center gap-x-8 gap-y-4 px-4 py-5 md:justify-between md:py-6">
        {/* big bold message */}
        <p className="font-sans text-2xl font-bold uppercase leading-none tracking-[-0.01em] text-ink md:text-4xl">
          Doors open in:
        </p>

        {/* huge numbers with colon separators */}
        <div className="flex items-start justify-center">
          {values.map((v, i) => (
            <div key={units[i]} className="flex items-start">
              {i > 0 && (
                <span className="px-1.5 font-sans text-4xl font-bold leading-none text-accent/50 md:px-3 md:text-6xl">
                  :
                </span>
              )}
              <div className="flex flex-col items-center">
                <span className="font-sans text-4xl font-bold leading-none tabular-nums text-ink md:text-6xl">
                  {String(v).padStart(2, '0')}
                </span>
                <span className="mt-2 text-[10px] font-medium uppercase tracking-[0.15em] text-muted md:text-xs">
                  {units[i]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
