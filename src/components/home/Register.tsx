'use client'

import { useEffect, useState } from 'react'
import { Check, Clock } from 'lucide-react'
import { Container } from '@/components/primitives/Container'
import { Eyebrow } from '@/components/primitives/SectionHeading'
import { Reveal } from '@/components/primitives/Reveal'
import { Combobox } from '@/components/primitives/Combobox'
import { cn } from '@/lib/cn'
import { site, registrationOpen, registrationSectors, registerAsOptions, tamilNaduCities } from '@/content/site'

/*
 * Registration — free, and deliberately so.
 *
 * This form used to open Razorpay Checkout. It no longer does: paying is now the
 * ticket section's job (see components/home/Tickets.tsx), where the visitor first
 * chooses which of the three passes they want. Putting a single price on this form
 * could only ever have been one of those three, so a payment wall here forced a choice
 * the page had not yet offered.
 *
 * What is left is the waitlist: leave your details, hear first when something opens.
 * That is also why the approved waitlist email is still the right confirmation to send
 * from /api/register — nobody reaching this form has been charged anything.
 */

type Status = 'idle' | 'sending' | 'done' | 'error'

export function Register() {
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [sector, setSector] = useState('')
  const [registerAs, setRegisterAs] = useState('')
  const [city, setCity] = useState('')
  // Stored as the bare 10 digits. The +91 is a fixed prefix in the UI and is added
  // back on submit, so there is exactly one format in the sheet and the emails.
  const [phone, setPhone] = useState('')
  const [sectorError, setSectorError] = useState(false)
  const [registerAsError, setRegisterAsError] = useState(false)
  const [cityError, setCityError] = useState(false)
  const [phoneError, setPhoneError] = useState(false)

  // Any click on a link to #register (nav Register, mobile nav, "Attend") scrolls
  // there via the anchor — then we drop the cursor into the Name field. Using the
  // click (not hashchange) means it works even when already at #register.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const link = (e.target as HTMLElement | null)?.closest('a[href$="#register"]')
      if (!link) return
      window.setTimeout(() => {
        document.getElementById('reg-name')?.focus({ preventScroll: true })
      }, 400)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)

    // The comboboxes are custom controls, so the browser's own required-field
    // validation can't see them — check them here before we hit the network.
    const missingSector = !sector
    const missingRegisterAs = !registerAs
    const missingCity = !city
    // Indian mobiles are 10 digits starting 6–9. The range check is what catches a
    // pasted leading 0 or 91, which would otherwise truncate to a wrong number.
    const badPhone = !/^[6-9]\d{9}$/.test(phone)
    setSectorError(missingSector)
    setRegisterAsError(missingRegisterAs)
    setCityError(missingCity)
    setPhoneError(badPhone)
    if (missingSector || missingRegisterAs || missingCity || badPhone) return

    setStatus('sending')
    setErrorMsg('')
    try {
      // Same-origin POST to our own route handler, which writes the Google Sheet
      // row and sends both confirmation emails. Unlike the old no-cors call
      // straight to Apps Script, this response is readable — so a failure here is
      // a real failure, not an optimistic guess.
      const res = await fetch('/api/register', {
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

      setStatus('done')
      form.reset()
      setSector('')
      setRegisterAs('')
      setCity('')
      setPhone('')
    } catch {
      setErrorMsg('')
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
            <Eyebrow className="text-accent">{registrationOpen ? 'Not ready to book?' : 'Save the dates'}</Eyebrow>
            <h2 className="mt-4 font-sans text-4xl font-bold uppercase leading-[1.02] tracking-[-0.01em] text-surface md:text-6xl">
              {registrationOpen ? (
                <>Register for<br />updates</>
              ) : (
                <>Registration<br />opens soon</>
              )}
            </h2>
            <p className="mt-6 max-w-md text-lg text-surface/85">
              {registrationOpen ? (
                <>
                  Still deciding which pass is right? Leave your details and we&apos;ll keep you posted on the agenda,
                  speakers and any remaining slots. See you in {site.city.split(',')[0]}.
                </>
              ) : (
                <>
                  We&apos;re putting the finishing touches on registration. It opens shortly — check back soon to
                  reserve your place in {site.city.split(',')[0]}.
                </>
              )}
            </p>
            {registrationOpen && (
              <p className="mt-4 text-base text-surface/70">
                Ready to book?{' '}
                <a href="#tickets" className="font-semibold text-accent hover:underline">
                  See the three passes
                </a>
                .
              </p>
            )}
            <p className="mt-6 font-sans text-sm font-bold uppercase tracking-[0.14em] text-accent">
              {site.dates} · {site.venue}
            </p>
          </div>
        </Reveal>

        {/* Right — form card (or "opening soon" when the flag is off) */}
        <Reveal delay={0.1}>
          <div className="rounded-2xl bg-surface p-6 text-ink shadow-2xl sm:p-8">
            {!registrationOpen ? (
              <div className="flex flex-col items-center py-12 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
                  <Clock size={30} className="text-accent" />
                </span>
                <h3 className="mt-6 font-sans text-2xl font-bold uppercase text-ink">Opening soon</h3>
                <p className="mt-2 max-w-xs text-muted">
                  Registration isn&apos;t open just yet. It goes live shortly — meanwhile, reach us at{' '}
                  <a href={`mailto:${site.contactEmail}`} className="font-medium text-accent hover:underline">
                    {site.contactEmail}
                  </a>
                  .
                </p>
                <p className="mt-6 font-sans text-xs font-bold uppercase tracking-[0.14em] text-muted">
                  {site.dates} · {site.venue}, {site.city.split(',')[0]}
                </p>
              </div>
            ) : status === 'done' ? (
              <div className="flex flex-col items-center py-10 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent">
                  <Check size={30} strokeWidth={3} className="text-accent-ink" />
                </span>
                <h3 className="mt-6 font-sans text-2xl font-bold uppercase text-ink">You&apos;re on the list.</h3>
                <p className="mt-2 max-w-xs text-muted">
                  A confirmation is on its way to your inbox. We&apos;ll be in touch with the agenda and any
                  remaining slots — see you in {site.city.split(',')[0]}.
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
                <Field label="Name">
                  <input id="reg-name" name="name" type="text" required placeholder="Your full name" className={inputCls} />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Email">
                    <input name="email" type="email" required placeholder="you@email.com" className={inputCls} />
                  </Field>
                  <Field label="Phone no">
                    {/* +91 is fixed chrome, not typed input — that is what makes the
                        stored format single-valued. The visible box holds digits only
                        and the hidden field carries the canonical string. */}
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
                        aria-label="Phone number, 10 digits"
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
                    {phoneError && (
                      <span className="text-xs font-medium text-accent">Enter a 10-digit mobile number.</span>
                    )}
                  </Field>
                </div>

                <Field label="Sector">
                  <Combobox
                    label="Sector"
                    placeholder="Please select"
                    searchPlaceholder="Search sectors…"
                    value={sector}
                    onChange={(v) => {
                      setSector(v)
                      setSectorError(false)
                    }}
                    options={registrationSectors}
                    invalid={sectorError}
                  />
                  <input type="hidden" name="sector" value={sector} />
                  {sectorError && <span className="text-xs font-medium text-accent">Please pick a sector.</span>}
                </Field>

                <Field label="Register as">
                  <Combobox
                    label="Register as"
                    placeholder="Please select"
                    value={registerAs}
                    onChange={(v) => {
                      setRegisterAs(v)
                      setRegisterAsError(false)
                    }}
                    options={registerAsOptions}
                    invalid={registerAsError}
                  />
                  <input type="hidden" name="registerAs" value={registerAs} />
                  {registerAsError && (
                    <span className="text-xs font-medium text-accent">Please pick how you&apos;re registering.</span>
                  )}
                </Field>

                <Field label="City (Tamil Nadu)">
                  <Combobox
                    label="City (Tamil Nadu)"
                    placeholder="Select your city"
                    searchPlaceholder="Search Tamil Nadu cities…"
                    value={city}
                    onChange={(v) => {
                      setCity(v)
                      setCityError(false)
                    }}
                    options={tamilNaduCities}
                    invalid={cityError}
                  />
                  <input type="hidden" name="city" value={city} />
                  {cityError && <span className="text-xs font-medium text-accent">Please pick your city.</span>}
                </Field>

                {/* Opt-in, pre-ticked and optional: it was `required`, so anyone who
                    missed it got a browser validation stop with no visible error on the
                    submit button. It is a preference, not a gate. */}
                <label className="mt-1 flex items-start gap-3 text-sm text-muted">
                  <input
                    type="checkbox"
                    name="updates"
                    defaultChecked
                    className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
                  />
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
                  {status === 'sending' ? 'Registering…' : 'Register'}
                </button>

                {status === 'error' && (
                  <p className="text-sm font-medium text-accent">
                    {errorMsg || 'Something went wrong'} — please try again, or email {site.contactEmail}.
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
