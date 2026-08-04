'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { Container } from '@/components/primitives/Container'
import { Eyebrow } from '@/components/primitives/SectionHeading'
import { Reveal } from '@/components/primitives/Reveal'
import { Select } from '@/components/primitives/Select'
import { site, registrationEndpoint, registrationRoles } from '@/content/site'

type Status = 'idle' | 'sending' | 'done' | 'error'

export function Register() {
  const [status, setStatus] = useState<Status>('idle')
  const [role, setRole] = useState('')
  const [roleError, setRoleError] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)

    if (!role) {
      setRoleError(true)
      return
    }

    if (!registrationEndpoint) {
      console.error('NEXT_PUBLIC_REGISTRATION_ENDPOINT is not set — see REGISTRATION-SETUP.md')
      setStatus('error')
      return
    }

    setStatus('sending')
    try {
      // Static site → Google Apps Script Web App. no-cors: fire-and-forget POST
      // (Apps Script doesn't return CORS headers, so we can't read the response).
      await fetch(registrationEndpoint, {
        method: 'POST',
        mode: 'no-cors',
        body: new URLSearchParams(fd as unknown as Record<string, string>),
      })
      setStatus('done')
      form.reset()
      setRole('')
    } catch {
      setStatus('error')
    }
  }

  return (
    <section id="register" className="relative overflow-hidden bg-base text-surface">
      {/* subtle grid + glow to match the story section */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div className="pointer-events-none absolute -left-32 -bottom-32 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />

      <Container wide className="relative grid gap-12 py-16 md:grid-cols-2 md:gap-16 md:py-24">
        {/* Left — copy */}
        <Reveal>
          <div className="flex h-full flex-col justify-center">
            <Eyebrow className="text-accent">Tickets are limited</Eyebrow>
            <h2 className="mt-4 font-sans text-4xl font-bold uppercase leading-[1.02] tracking-[-0.01em] text-surface md:text-6xl">
              Register for<br />ticket updates
            </h2>
            <p className="mt-6 max-w-md text-lg text-surface/85">
              Leave your details and we&apos;ll reach you first the moment tickets open. See you in{' '}
              {site.city.split(',')[0]}.
            </p>
            <p className="mt-6 font-sans text-sm font-bold uppercase tracking-[0.14em] text-accent">
              {site.dates} · {site.venue}
            </p>
          </div>
        </Reveal>

        {/* Right — form card */}
        <Reveal delay={0.1}>
          <div className="rounded-2xl bg-surface p-6 text-ink shadow-2xl sm:p-8">
            {status === 'done' ? (
              <div className="flex flex-col items-center py-10 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent">
                  <Check size={30} strokeWidth={3} className="text-accent-ink" />
                </span>
                <h3 className="mt-6 font-sans text-2xl font-bold uppercase text-ink">You&apos;re on the list.</h3>
                <p className="mt-2 max-w-xs text-muted">
                  We&apos;ll be in touch the moment tickets open. See you in {site.city.split(',')[0]}.
                </p>
                <button
                  onClick={() => setStatus('idle')}
                  className="mt-6 text-btn font-bold uppercase text-accent hover:underline"
                >
                  Register someone else
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="flex flex-col gap-4">
                <Field label="Full name">
                  <input name="name" type="text" required placeholder="Your name" className={inputCls} />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Mobile">
                    <input name="mobile" type="tel" required placeholder="+91" className={inputCls} />
                  </Field>
                  <Field label="City">
                    <input name="city" type="text" required placeholder="Erode" className={inputCls} />
                  </Field>
                </div>
                <Field label="Email">
                  <input name="email" type="email" required placeholder="you@email.com" className={inputCls} />
                </Field>
                <Field label="I'm coming as a…">
                  <Select
                    label="I'm coming as a…"
                    placeholder="Select one"
                    value={role}
                    onChange={(v) => {
                      setRole(v)
                      setRoleError(false)
                    }}
                    options={registrationRoles}
                    invalid={roleError}
                  />
                  <input type="hidden" name="role" value={role} />
                  {roleError && <span className="text-xs font-medium text-accent">Please pick one.</span>}
                </Field>

                <label className="mt-1 flex items-start gap-3 text-sm text-muted">
                  <input type="checkbox" required className="mt-0.5 h-4 w-4 shrink-0 accent-accent" />
                  <span>
                    Keep me posted about tickets, the agenda and speaker announcements for the Tier-2 Rising Startup
                    Summit.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="mt-2 bg-accent py-4 font-sans text-btn font-bold uppercase text-accent-ink transition-colors hover:bg-base hover:text-surface disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {status === 'sending' ? 'Sending…' : 'Notify me about tickets'}
                </button>

                {status === 'error' && (
                  <p className="text-sm font-medium text-accent">
                    Something went wrong — please try again, or email {site.contactEmail}.
                  </p>
                )}
              </form>
            )}
          </div>
        </Reveal>
      </Container>
    </section>
  )
}

const inputCls =
  'w-full border border-ink/15 bg-foam px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-muted/70 focus:border-accent focus:bg-surface'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-sans text-xs font-bold uppercase tracking-[0.12em] text-muted">{label}</span>
      {children}
    </label>
  )
}
