'use client'

import { useState } from 'react'
import { site, socials } from '@/content/site'
import { Container } from '@/components/primitives/Container'

export function SiteFooter() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  return (
    <>
      <footer id="footer" className="bg-base text-surface">
        <Container wide className="grid gap-10 py-14 md:grid-cols-3 md:py-16">
          {/* Brand + contact */}
          <div className="flex flex-col gap-4">
            <span className="font-sans text-3xl font-black uppercase leading-none tracking-tight">
              Tier-2 <span className="text-accent">Rising</span>
            </span>
            <p className="max-w-xs text-sm text-surface/70">
              {site.fullName} — {site.initiativeBy}. {site.dates}, {site.venue}, {site.city}.
            </p>
            <a href={`mailto:${site.contactEmail}`} className="text-sm text-accent hover:underline">
              {site.contactEmail}
            </a>
            <div className="mt-2 flex gap-4 text-sm">
              {socials.map((s) => (
                <a key={s.label} href={s.href} className="text-surface/70 hover:text-accent">
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            {['Our Vision', 'Two-Day Format', 'Growth Zones', 'Key Initiatives', 'Partners', 'Speakers', 'Who Attends', 'Register'].map(
              (l) => (
                <a
                  key={l}
                  href={`#${l.toLowerCase().replace(/[^a-z]+/g, '-').replace(/(^-|-$)/g, '')}`}
                  className="py-1 text-surface/70 hover:text-accent"
                >
                  {l}
                </a>
              ),
            )}
          </div>

          {/* Newsletter */}
          <div className="flex flex-col gap-3">
            <p className="text-sm font-bold uppercase tracking-widest text-accent">Stay in the loop</p>
            {sent ? (
              <p className="text-sm text-surface/80">Thanks — we&apos;ll be in touch.</p>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (email) setSent(true)
                }}
                className="flex flex-col gap-3"
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  className="border-b border-surface/40 bg-transparent px-1 py-2 text-sm text-surface placeholder:text-surface/50 focus:border-accent focus:outline-none"
                />
                <button className="bg-accent py-3 text-btn font-bold uppercase text-accent-ink hover:bg-surface">
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </Container>
      </footer>

      {/* Copyright bar */}
      <div className="bg-accent">
        <Container wide className="flex flex-col items-center justify-between gap-2 py-3 sm:flex-row">
          <p className="font-sans text-sm font-bold uppercase text-accent-ink">
            © 2026 {site.fullName} · {site.initiativeBy}
          </p>
          <p className="text-sm font-bold uppercase text-accent-ink/80">Technology partner · TealOrca</p>
        </Container>
      </div>
    </>
  )
}
