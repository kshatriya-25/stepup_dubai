'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, ArrowRight, ArrowLeft, Check } from 'lucide-react'
import { participateRoutes, site } from '@/content/site'
import { cn } from '@/lib/cn'

const Ctx = createContext<{ open: () => void; close: () => void } | null>(null)

export function useParticipate() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useParticipate must be used within ParticipateProvider')
  return ctx
}

/** menu = the three options; form = partner enquiry; done = thank-you. */
type View = 'menu' | 'form' | 'done'

export function ParticipateProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false)
  const [view, setView] = useState<View>('menu')

  // Always reopen on the menu — a visitor who closed mid-enquiry should not come
  // back to a half-filled form with no idea how they got there.
  function close() {
    setOpen(false)
  }
  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => setView('menu'), 250) // after the exit animation
      return () => clearTimeout(t)
    }
  }, [isOpen])

  return (
    <Ctx.Provider value={{ open: () => setOpen(true), close }}>
      {children}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4"
            style={{ background: 'rgba(7,43,95,0.55)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && close()}
          >
            <motion.div
              className="my-auto w-full max-w-3xl bg-accent p-8 sm:p-12"
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  {view === 'form' && (
                    <button
                      type="button"
                      aria-label="Back to options"
                      onClick={() => setView('menu')}
                      className="text-accent-ink transition-opacity hover:opacity-70"
                    >
                      <ArrowLeft size={26} />
                    </button>
                  )}
                  <h2 className="font-sans text-3xl font-bold uppercase text-accent-ink sm:text-4xl">
                    {view === 'menu' ? 'Participate' : 'Partner with us'}
                  </h2>
                </div>
                <button aria-label="Close" onClick={close} className="shrink-0 text-accent-ink">
                  <X size={28} />
                </button>
              </div>

              {view === 'menu' && (
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {participateRoutes.map((r) =>
                    r.action === 'partner' ? (
                      <button
                        key={r.label}
                        type="button"
                        onClick={() => setView('form')}
                        className="group flex items-center justify-between border border-base/20 bg-base px-5 py-5 text-left text-surface transition-colors hover:bg-base-2"
                      >
                        <span>
                          <span className="block font-sans text-lg font-bold uppercase">{r.label}</span>
                          <span className="block text-sm text-surface/70">{r.desc}</span>
                        </span>
                        <ArrowRight size={20} className="shrink-0 transition-transform group-hover:translate-x-1" />
                      </button>
                    ) : (
                      <a
                        key={r.label}
                        href={r.href}
                        onClick={close}
                        className="group flex items-center justify-between border border-base/20 bg-base px-5 py-5 text-surface transition-colors hover:bg-base-2"
                      >
                        <span>
                          <span className="block font-sans text-lg font-bold uppercase">{r.label}</span>
                          <span className="block text-sm text-surface/70">{r.desc}</span>
                        </span>
                        <ArrowRight size={20} className="shrink-0 transition-transform group-hover:translate-x-1" />
                      </a>
                    ),
                  )}
                </div>
              )}

              {view === 'form' && <PartnerForm onDone={() => setView('done')} />}

              {view === 'done' && (
                <div className="mt-8 flex flex-col items-center bg-base px-6 py-12 text-center text-surface">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent">
                    <Check size={30} strokeWidth={3} className="text-accent-ink" />
                  </span>
                  <h3 className="mt-6 font-sans text-2xl font-bold uppercase">Thanks — we&apos;ve got it.</h3>
                  <p className="mt-2 max-w-sm text-surface/75">
                    A confirmation is on its way to your inbox. Someone from the team will be in touch shortly to
                    talk through sponsorship, speaking and desk options.
                  </p>
                  <button
                    onClick={close}
                    className="mt-6 font-sans text-btn font-bold uppercase text-accent hover:underline"
                  >
                    Close
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Ctx.Provider>
  )
}

type Status = 'idle' | 'sending' | 'error'

function PartnerForm({ onDone }: { onDone: () => void }) {
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  // Bare 10 digits; the +91 is fixed chrome and is re-attached on submit, matching
  // the registration form so both feed the sheet one phone format.
  const [phone, setPhone] = useState('')
  const [phoneError, setPhoneError] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)

    const badPhone = !/^[6-9]\d{9}$/.test(phone)
    setPhoneError(badPhone)
    if (badPhone) return

    setStatus('sending')
    setErrorMsg('')
    try {
      const res = await fetch('/api/partner', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(fd)),
      })
      const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null
      if (!res.ok || !data?.ok) {
        setErrorMsg(data?.error || '')
        setStatus('error')
        return
      }
      onDone()
    } catch {
      setErrorMsg('')
      setStatus('error')
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4 bg-surface p-6 text-ink sm:p-8">
      <p className="text-sm text-muted">
        Tell us who you are and we&rsquo;ll come back with sponsorship, speaking and desk options.
      </p>

      <Field label="Business name">
        <input name="businessName" type="text" required placeholder="Your company or organisation" className={input} />
      </Field>

      <Field label="Your name">
        <input name="name" type="text" required placeholder="Full name" className={input} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email">
          <input name="email" type="email" required placeholder="you@company.com" className={input} />
        </Field>
        <Field label="Mobile no">
          <div
            className={cn(
              'flex items-center border bg-foam transition-colors focus-within:bg-surface',
              phoneError ? 'border-accent' : 'border-ink/15 focus-within:border-accent',
            )}
          >
            <span className="select-none border-r border-ink/10 px-3 py-3 text-sm text-muted">+91</span>
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={10}
              aria-label="Mobile number, 10 digits"
              placeholder="9876543210"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                setPhoneError(false)
              }}
              className="w-full bg-transparent px-3 py-3 text-sm text-ink outline-none placeholder:text-muted/70"
            />
          </div>
          <input type="hidden" name="phone" value={phone ? `+91 ${phone.slice(0, 5)} ${phone.slice(5)}` : ''} />
          {phoneError && <span className="text-xs font-medium text-accent">Enter a 10-digit mobile number.</span>}
        </Field>
      </div>

      <button
        type="submit"
        disabled={status === 'sending'}
        className="mt-2 bg-accent py-4 font-sans text-btn font-bold uppercase text-accent-ink transition-colors hover:bg-base hover:text-surface disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === 'sending' ? 'Sending…' : 'Submit enquiry'}
      </button>

      {status === 'error' && (
        <p className="text-sm font-medium text-accent">
          {errorMsg || 'Something went wrong'} — please try again, or email {site.contactEmail}.
        </p>
      )}
    </form>
  )
}

const input =
  'w-full border border-ink/15 bg-foam px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-muted/70 focus:border-accent focus:bg-surface'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-sans text-xs font-bold uppercase tracking-[0.12em] text-muted">{label}</span>
      {children}
    </label>
  )
}
