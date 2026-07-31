'use client'

import { cn } from '@/lib/cn'
import { useCountdown, useStickyBottom } from '@/lib/hooks'
import { site } from '@/content/site'

const units = ['Days', 'Hours', 'Min', 'Sec'] as const

export function CountdownBar() {
  const t = useCountdown(site.startISO)
  const { stick, hidden } = useStickyBottom()
  const values = [t.days, t.hours, t.minutes, t.seconds]

  return (
    <div
      className={cn(
        'z-[60] w-full border-y border-base/10 bg-surface',
        stick && 'fixed bottom-0 left-0 animate-fadein shadow-sticky',
        stick && hidden && 'hidden',
      )}
    >
      <div className="mx-auto flex max-w-container-wide flex-col items-center gap-3 px-4 py-3 sm:flex-row sm:justify-between">
        <p className="font-sans text-sm font-bold uppercase text-base sm:text-base">
          Doors open in — {site.dates}
        </p>

        <div className="flex items-end gap-4">
          {values.map((v, i) => (
            <div key={units[i]} className="flex flex-col items-center">
              <span className="font-sans text-3xl font-black leading-none text-base tabular-nums sm:text-count">
                {String(v).padStart(2, '0')}
              </span>
              <span className="mt-1 text-[10px] font-medium uppercase tracking-wide text-base/50">{units[i]}</span>
            </div>
          ))}
        </div>

        <a
          href={site.register}
          className="bg-base px-6 py-3 text-btn font-bold uppercase text-accent hover:bg-accent hover:text-accent-ink"
        >
          Register Free
        </a>
      </div>
    </div>
  )
}
