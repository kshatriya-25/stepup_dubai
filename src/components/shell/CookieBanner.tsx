'use client'

import { useEffect, useState } from 'react'

export function CookieBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('t2r-consent')) setShow(true)
  }, [])

  const decide = (v: 'accept' | 'deny') => {
    localStorage.setItem('t2r-consent', v)
    setShow(false)
  }

  if (!show) return null
  return (
    <div className="fixed inset-x-0 bottom-0 z-[90] bg-base/95 backdrop-blur">
      <div className="mx-auto flex max-w-container-wide flex-col items-center gap-3 px-4 py-4 text-surface sm:flex-row sm:justify-between">
        <p className="text-sm text-surface/80">
          We use cookies to understand how the site is used. You can accept or decline.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => decide('deny')}
            className="border border-surface/30 px-4 py-2 text-sm uppercase text-surface hover:bg-surface/10"
          >
            Decline
          </button>
          <button
            onClick={() => decide('accept')}
            className="bg-accent px-4 py-2 text-sm font-bold uppercase text-accent-ink hover:bg-surface"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
