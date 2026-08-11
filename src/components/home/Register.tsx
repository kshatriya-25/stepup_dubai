'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Clock, Loader2, ShieldCheck } from 'lucide-react'
import { Container } from '@/components/primitives/Container'
import { Eyebrow } from '@/components/primitives/SectionHeading'
import { Reveal } from '@/components/primitives/Reveal'
import { Combobox } from '@/components/primitives/Combobox'
import { cn } from '@/lib/cn'
import { site, registrationOpen, registrationSectors, registerAsOptions, tamilNaduCities } from '@/content/site'

/*
 * Registration, with or without payment.
 *
 * When `payment.enabled` is false this behaves exactly as it always has: POST to
 * /api/register, join the waitlist. When it is true the flow becomes
 *
 *   create order → Razorpay Checkout → verify → confirmed
 *
 * THE RULE THAT SHAPES THIS COMPONENT: from the moment Checkout hands back a success
 * callback, the customer must never see a failure. They have been charged. A red error
 * at that point makes people pay twice — and refunding a duplicate is a far worse
 * afternoon than showing a softer message and letting the server's alert path do its
 * job. So `paid` is tracked separately from `ok`, and once it is true the UI can only
 * ever land on a success screen, with wording that varies by how complete the backend
 * managed to be.
 */

type Status = 'idle' | 'sending' | 'confirming' | 'done' | 'error'

type PaymentProps = {
  enabled: boolean
  amountLabel: string
}

type RazorpayResponse = {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

type RazorpayInstance = {
  open: () => void
  on: (event: string, handler: (e: unknown) => void) => void
  close: () => void
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance
  }
}

const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js'

/**
 * Load Checkout once, on demand. Cached as a promise so a double-click cannot start
 * two loads, and cleared on failure so a visitor who lost connection mid-load can
 * retry rather than being stuck with a permanently rejected promise.
 */
let checkoutPromise: Promise<void> | null = null
function loadCheckout(): Promise<void> {
  if (typeof window !== 'undefined' && window.Razorpay) return Promise.resolve()
  if (checkoutPromise) return checkoutPromise
  checkoutPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${CHECKOUT_SRC}"]`)
    const el = existing ?? document.createElement('script')
    el.src = CHECKOUT_SRC
    el.async = true
    el.addEventListener('load', () => resolve())
    el.addEventListener('error', () => reject(new Error('checkout script failed to load')))
    if (!existing) document.body.appendChild(el)
  }).catch((err) => {
    checkoutPromise = null
    throw err
  })
  return checkoutPromise
}

export function Register({ payment }: { payment?: PaymentProps }) {
  /*
   * The price is confirmed against the server at runtime, not just taken from the prop.
   *
   * This page is statically prerendered, so the prop's value was frozen at BUILD time.
   * Change REGISTRATION_FEE_INR and restart without rebuilding and the page would
   * advertise the old price while /api/payment/order charges the new one — the exact
   * drift the single-source rule exists to prevent, reintroduced by the build cache.
   *
   * The prop is still the initial render (correct at build, no layout shift, and it
   * keeps working if the fetch fails); this reconciles it with what the server will
   * actually charge.
   */
  const [pay, setPay] = useState<PaymentProps>(payment ?? { enabled: false, amountLabel: '' })

  useEffect(() => {
    let cancelled = false
    fetch('/api/payment/order', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d: { enabled?: boolean; amount?: string | null } | null) => {
        if (cancelled || !d) return
        const live = { enabled: Boolean(d.enabled), amountLabel: d.amount || '' }
        setPay((prev) =>
          prev.enabled === live.enabled && prev.amountLabel === live.amountLabel ? prev : live,
        )
      })
      // A failed check leaves the build-time value in place. It is the best information
      // available, and the order endpoint remains authoritative for the actual charge.
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  /** Set when the customer's money has definitely moved. Gates every failure path. */
  const [paidNote, setPaidNote] = useState('')
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

  // Guards a second submit while an order or a verification is in flight. State alone
  // is not enough — React batches, and a fast double-click can read a stale value.
  const busy = useRef(false)

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

  /*
   * Warn before closing the tab while we are confirming a payment.
   *
   * The webhook covers this case server-side, so nothing is actually lost — but a
   * customer who closes here and sees no confirmation for a minute will assume it
   * failed and pay again. Keeping them on the page for two more seconds is the
   * cheapest possible prevention.
   */
  useEffect(() => {
    if (status !== 'confirming') return
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [status])

  function resetForm(form: HTMLFormElement) {
    form.reset()
    setSector('')
    setRegisterAs('')
    setCity('')
    setPhone('')
  }

  function validate(): boolean {
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
    return !(missingSector || missingRegisterAs || missingCity || badPhone)
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (busy.current) return
    const form = e.currentTarget
    const fields = Object.fromEntries(new FormData(form))

    // The comboboxes are custom controls, so the browser's own required-field
    // validation can't see them — check them here before we hit the network.
    if (!validate()) return

    busy.current = true
    setStatus('sending')
    setErrorMsg('')
    setPaidNote('')

    try {
      if (pay.enabled) {
        await runPaidFlow(fields, form)
      } else {
        await runFreeFlow(fields, form)
      }
    } catch {
      // Only reachable before Checkout opens — the paid flow owns everything after.
      setErrorMsg('')
      setStatus('error')
    } finally {
      busy.current = false
    }
  }

  /** The original waitlist path, unchanged. Used whenever payment is switched off. */
  async function runFreeFlow(fields: Record<string, unknown>, form: HTMLFormElement) {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(fields),
    })
    const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null
    if (!res.ok || !data?.ok) {
      setErrorMsg(data?.error || '')
      setStatus('error')
      return
    }
    setStatus('done')
    resetForm(form)
  }

  async function runPaidFlow(fields: Record<string, unknown>, form: HTMLFormElement) {
    // 1. Create the order server-side. The amount comes from the server; the browser
    //    never sends or sees a price it could tamper with.
    const orderRes = await fetch('/api/payment/order', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(fields),
    })
    const order = (await orderRes.json().catch(() => null)) as
      | {
          ok?: boolean
          error?: string
          keyId?: string
          orderId?: string
          amount?: number
          currency?: string
          prefill?: { name: string; email: string; contact: string }
        }
      | null

    if (!orderRes.ok || !order?.ok || !order.orderId || !order.keyId) {
      setErrorMsg(order?.error || '')
      setStatus('error')
      return
    }

    // 2. Load Checkout. A failure here is safe — no money has moved.
    try {
      await loadCheckout()
    } catch {
      setErrorMsg('Could not reach the payment provider. Check your connection and try again.')
      setStatus('error')
      return
    }
    if (!window.Razorpay) {
      setErrorMsg('Could not start the payment window. Please try again.')
      setStatus('error')
      return
    }

    // 3. Hand over to Razorpay.
    const rzp = new window.Razorpay({
      key: order.keyId,
      order_id: order.orderId,
      amount: order.amount,
      currency: order.currency || 'INR',
      name: site.fullName,
      description: `${site.dates} · ${site.venue}, ${site.city}`,
      prefill: order.prefill,
      notes: { source: 'tier2rising.com' },
      theme: { color: '#F47B20' },
      // Razorpay retries a failed attempt inside its own modal. Letting it do that is
      // better than closing and making the customer refill the form.
      retry: { enabled: true, max_count: 3 },
      modal: {
        // Deliberate: closing the modal mid-payment while a bank page is open is how
        // people end up charged with no record on our side.
        escape: false,
        ondismiss: () => {
          busy.current = false
          // No money moved — Checkout only fires this when the customer backs out
          // before completing. Say so explicitly; silence reads as failure.
          setErrorMsg('Payment cancelled — you have not been charged. Your details are still filled in.')
          setStatus('error')
        },
      },
      handler: (response: RazorpayResponse) => {
        // Do NOT await inside the handler — Razorpay closes its modal when this
        // returns, and holding it open behind a network call looks like a freeze.
        void confirmPayment(response, form)
      },
    })

    rzp.on('payment.failed', (e: unknown) => {
      busy.current = false
      const desc =
        (e as { error?: { description?: string } } | null)?.error?.description ||
        'The payment did not go through.'
      // Razorpay only emits this for genuinely failed attempts, so it is safe to show
      // as an error — no money has been captured.
      setErrorMsg(`${desc} You have not been charged — please try again.`)
      setStatus('error')
    })

    rzp.open()
  }

  /**
   * Everything past this point runs AFTER the customer has been charged.
   * There is no path here that shows a failure. See the note at the top of the file.
   */
  async function confirmPayment(response: RazorpayResponse, form: HTMLFormElement) {
    setStatus('confirming')
    try {
      const res = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(response),
      })
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; paid?: boolean | null; recorded?: boolean; message?: string; error?: string }
        | null

      if (data?.ok) {
        setPaidNote(data.message || '')
        setStatus('done')
        resetForm(form)
        return
      }

      /*
       * A 402 (payment genuinely did not complete) is the one case where the money did
       * not move and an error is honest. Anything else at this stage is ambiguous, and
       * ambiguity is resolved in the customer's favour: the webhook and the hourly
       * reconciliation will settle it server-side, so we show a "we're confirming"
       * success rather than inviting a second payment.
       */
      if (res.status === 402) {
        setErrorMsg(data?.error || 'That payment did not complete. You have not been charged.')
        setStatus('error')
        return
      }

      setPaidNote(
        "We're confirming your payment. If it went through you'll receive an email shortly — " +
          'please do not pay again. Contact us if you have not heard within an hour.',
      )
      setStatus('done')
      resetForm(form)
    } catch {
      // The browser could not reach us at all — but Razorpay already has the payment
      // and the webhook is independent of this request. Reassure, never alarm.
      setPaidNote(
        'Your payment was submitted. Our confirmation email is on its way — please do not pay again. ' +
          `If you have not heard within an hour, contact ${site.contactEmail} with your payment ID.`,
      )
      setStatus('done')
      resetForm(form)
    } finally {
      busy.current = false
    }
  }

  const submitting = status === 'sending' || status === 'confirming'
  const submitLabel =
    status === 'confirming'
      ? 'Confirming payment…'
      : status === 'sending'
        ? pay.enabled
          ? 'Starting payment…'
          : 'Registering…'
        : pay.enabled
          ? `Pay ${pay.amountLabel} & Register`
          : 'Register'

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
            <Eyebrow className="text-accent">
              {registrationOpen ? 'Tickets are limited' : 'Save the dates'}
            </Eyebrow>
            <h2 className="mt-4 font-sans text-4xl font-bold uppercase leading-[1.02] tracking-[-0.01em] text-surface md:text-6xl">
              {registrationOpen ? (
                pay.enabled ? (
                  <>Book your<br />seat</>
                ) : (
                  <>Register for<br />ticket updates</>
                )
              ) : (
                <>Registration<br />opens soon</>
              )}
            </h2>
            <p className="mt-6 max-w-md text-lg text-surface/85">
              {registrationOpen ? (
                pay.enabled ? (
                  <>
                    Secure your place for {pay.amountLabel}. Payment is instant and your confirmation arrives by
                    email straight away. See you in {site.city.split(',')[0]}.
                  </>
                ) : (
                  <>
                    Leave your details and we&apos;ll reach you first the moment tickets open. See you in{' '}
                    {site.city.split(',')[0]}.
                  </>
                )
              ) : (
                <>
                  We&apos;re putting the finishing touches on registration. It opens shortly — check back soon to
                  reserve your place in {site.city.split(',')[0]}.
                </>
              )}
            </p>
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
                <h3 className="mt-6 font-sans text-2xl font-bold uppercase text-ink">
                  {pay.enabled ? "You're in." : "You're on the list."}
                </h3>
                <p className="mt-2 max-w-xs text-muted">
                  {paidNote ||
                    (pay.enabled
                      ? `Payment received and your seat is booked. Your receipt is on its way to your inbox — see you in ${site.city.split(',')[0]}.`
                      : `A confirmation is on its way to your inbox. We'll be in touch the moment tickets open — see you in ${site.city.split(',')[0]}.`)}
                </p>
                <button
                  onClick={() => {
                    setPaidNote('')
                    setStatus('idle')
                  }}
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
                  disabled={submitting}
                  className="mt-2 flex items-center justify-center gap-2 bg-accent py-4 font-sans text-btn font-bold uppercase text-accent-ink transition-colors hover:bg-base hover:text-surface disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  {submitLabel}
                </button>

                {pay.enabled && (
                  <p className="flex items-center justify-center gap-1.5 text-xs text-muted">
                    <ShieldCheck size={13} />
                    Secure payment by Razorpay · UPI, cards, net banking
                  </p>
                )}

                {/* Only ever rendered when no money has moved — see confirmPayment(). */}
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
