'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Check, Loader2, ShieldCheck, Clock, ArrowRight } from 'lucide-react'
import { Container } from '@/components/primitives/Container'
import { Reveal } from '@/components/primitives/Reveal'
import { Combobox } from '@/components/primitives/Combobox'
import { cn } from '@/lib/cn'
import { site, registrationSectors, registerAsOptions, tamilNaduCities } from '@/content/site'
import {
  tickets,
  ticketsNote,
  formatTicketPrice,
  TICKET_SALES_LIVE,
  type Ticket,
} from '@/content/tickets'

/**
 * "Tear off your entry" — the three paid passes.
 *
 * Each card is drawn as a physical ticket: body on the left, tear-off stub on the
 * right, joined by a perforation. The perforation is a dashed border with two small
 * circles in the page's own navy sitting over the card edges, which reads as punched
 * holes rather than decoration. It flips from vertical to horizontal below 768px, and
 * the two notch pairs are separate elements per orientation — one pair cannot be made
 * to work in both without transforms that blur on retina.
 *
 * This is now the page's ONLY conversion point — the free registration/waitlist section
 * that used to sit below it has been removed, and every Register CTA on the site points
 * here. The checkout sheet asks for the same six details that form did (name, email,
 * phone, sector, register-as, city), so nothing is collected less than before.
 *
 * SELLING IS CURRENTLY SWITCHED OFF — see TICKET_SALES_LIVE in @/content/tickets.
 * Clicking a ticket opens a "booking opens soon" panel instead of the checkout sheet.
 * The checkout path below is complete and still type-checked; it is one boolean away
 * from being live. Nothing on this page can contact Razorpay while that flag is false.
 *
 * Note what that flag now costs: with the waitlist gone, leaving it false means the
 * site has no self-serve way to sign anyone up at all — every route ends at an email
 * link. That was an acceptable state when a live form sat underneath; it is not one to
 * ship for long.
 *
 * When it is on, clicking a price opens a checkout sheet — it cannot go straight to
 * Razorpay, because the Sheet row and the confirmation email need sector, city and
 * "register as", none of which Razorpay Checkout collects. So it is details →
 * Checkout, in one modal.
 */

const ACCENT_RULE: Record<Ticket['accent'], string> = {
  accent: 'bg-accent',
  cyan: 'bg-cyan',
  green: 'bg-green',
}

export function Tickets() {
  const [selected, setSelected] = useState<Ticket | null>(null)

  return (
    <section id="tickets" className="relative overflow-hidden bg-base text-surface">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <Container wide className="relative py-16 md:py-24">
        <Reveal>
          <div className="flex items-center gap-3">
            <span className="h-[2px] w-8 bg-accent" />
            <span className="font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
              Admit one · {site.city.split(',')[0]} · 10–11 Oct
            </span>
          </div>
          <h2 className="mt-4 font-sans text-4xl font-bold uppercase leading-[1.02] tracking-[-0.01em] md:text-6xl">
            Tear off your
            <br />
            <span className="text-accent">Entry</span>
          </h2>
          <p className="mt-5 max-w-md text-lg text-surface/80">
            Three tickets into the room. Pick the one that matches why you&apos;re coming.
          </p>
        </Reveal>

        <div className="mt-10 flex flex-col gap-5 md:mt-12">
          {tickets.map((t, i) => (
            <Reveal key={t.id} delay={i * 0.08}>
              <TicketCard ticket={t} onSelect={() => setSelected(t)} />
            </Reveal>
          ))}
        </div>

        <p className="mt-6 text-sm text-surface/55">{ticketsNote}</p>
      </Container>

      <TicketCheckout ticket={selected} onClose={() => setSelected(null)} />
    </section>
  )
}

function TicketCard({ ticket, onSelect }: { ticket: Ticket; onSelect: () => void }) {
  return (
    <article className="relative flex flex-col bg-surface text-ink sm:flex-row">
      {/* Body */}
      <div className="flex-1 p-6 sm:p-8">
        <div className="flex items-center gap-2.5">
          <span className={cn('h-[3px] w-7', ACCENT_RULE[ticket.accent])} />
          <span className="font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
            {ticket.eyebrow}
          </span>
        </div>

        <h3 className="mt-3 font-sans text-2xl font-bold uppercase leading-none tracking-[-0.01em] text-ink md:text-3xl">
          {ticket.name}
        </h3>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">{ticket.blurb}</p>

        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-ink/10 pt-5 sm:grid-cols-4">
          {ticket.meta.map((m) => (
            <div key={m.label}>
              <dt className="font-sans text-[9px] font-bold uppercase tracking-[0.14em] text-muted/70">
                {m.label}
              </dt>
              <dd className="mt-1 font-sans text-[11px] font-bold uppercase tracking-[0.08em] text-accent">
                {m.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Perforation + stub */}
      <div className="relative flex shrink-0 items-center justify-center p-6 sm:w-[220px] sm:p-8">
        {/* The tear line. Horizontal when stacked, vertical once side by side.
            It runs edge to edge so its ends meet the punched holes — inset it and you
            get a visible gap between the perforation and the hole it should join. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 border-t-2 border-dashed border-ink/20 sm:inset-y-0 sm:left-0 sm:right-auto sm:border-l-2 sm:border-t-0"
        />
        {/* Punched holes at the ends of the tear line — page-coloured, so they read as
            holes through the ticket rather than dots printed on it. */}
        <span aria-hidden className="absolute -left-2.5 -top-2.5 h-5 w-5 rounded-full bg-base sm:hidden" />
        <span aria-hidden className="absolute -right-2.5 -top-2.5 h-5 w-5 rounded-full bg-base sm:hidden" />
        <span
          aria-hidden
          className="absolute -top-2.5 left-0 hidden h-5 w-5 -translate-x-1/2 rounded-full bg-base sm:block"
        />
        <span
          aria-hidden
          className="absolute -bottom-2.5 left-0 hidden h-5 w-5 -translate-x-1/2 rounded-full bg-base sm:block"
        />

        <div className="flex w-full flex-col items-center text-center">
          <div className="font-sans text-4xl font-bold leading-none tracking-[-0.02em] text-ink">
            {formatTicketPrice(ticket)}
          </div>
          <div className="mt-1.5 font-sans text-[9px] font-bold uppercase tracking-[0.16em] text-muted">
            {ticket.unit}
          </div>
          <button
            type="button"
            onClick={onSelect}
            className={cn(
              'mt-4 w-full py-3 font-sans text-btn font-bold uppercase transition-colors',
              ticket.emphasis === 'solid'
                ? 'bg-accent text-accent-ink hover:bg-base hover:text-surface'
                : 'border border-base text-base hover:bg-base hover:text-surface',
            )}
          >
            {ticket.cta}
          </button>
        </div>
      </div>
    </article>
  )
}

/* ------------------------------------------------------------------ *
 * Checkout
 * ------------------------------------------------------------------ */

type Status = 'idle' | 'sending' | 'confirming' | 'done' | 'error'

type RazorpayResponse = {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}
type RazorpayInstance = { open: () => void; on: (e: string, h: (x: unknown) => void) => void }

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance
  }
}

const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js'

/**
 * Load Checkout once, on demand. Cached as a promise so a double-click cannot start
 * two loads, and cleared on failure so someone who lost connection mid-load can retry
 * rather than being stuck with a permanently rejected promise.
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

function TicketCheckout({ ticket, onClose }: { ticket: Ticket | null; onClose: () => void }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Lock the page behind the modal without losing scroll position — `overflow:hidden`
  // alone jumps the page to the top on iOS when the sheet closes.
  useEffect(() => {
    if (!ticket) return
    const y = window.scrollY
    const { body } = document
    const html = document.documentElement
    const prev = body.style.cssText
    body.style.cssText = `position:fixed;top:${-y}px;left:0;right:0;overflow:hidden;`
    return () => {
      body.style.cssText = prev
      /*
       * Restore the scroll position INSTANTLY.
       *
       * globals.css sets `html { scroll-behavior: smooth }` for the anchor nav, and
       * that applies to programmatic scrollTo too — so this line was animating the
       * page back to the exact position it was already at, which reads as the page
       * scrolling for no reason every time the sheet closes. Suppressing the
       * behaviour for this one synchronous call makes the restore invisible, which is
       * the whole point of it.
       */
      const prevBehavior = html.style.scrollBehavior
      html.style.scrollBehavior = 'auto'
      window.scrollTo(0, y)
      html.style.scrollBehavior = prevBehavior
    }
  }, [ticket])

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {ticket && (
        <motion.div
          className="fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto p-4"
          style={{ background: 'rgba(7,43,95,0.6)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            className="my-auto w-full max-w-xl bg-surface"
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {TICKET_SALES_LIVE ? (
              <CheckoutForm ticket={ticket} onClose={onClose} />
            ) : (
              <ComingSoon ticket={ticket} onClose={onClose} />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

/**
 * Shown in place of checkout while TICKET_SALES_LIVE is false.
 *
 * It keeps the same navy summary header as the real sheet, so the visitor still sees
 * exactly which pass and price they clicked — the click is acknowledged, not swallowed.
 *
 * It also does not dead-end. Somebody who just clicked "Book" on a ₹999 pass has told
 * us they intend to come, and the worst possible answer is a message with nowhere to
 * go. The primary action used to send them to the free registration waitlist; that
 * section has been removed, so it now opens a pre-addressed email instead. Less
 * automatic, but it still reaches a human and it does not point at an anchor that is
 * not on the page.
 */
function ComingSoon({ ticket, onClose }: { ticket: Ticket; onClose: () => void }) {
  // "Book" and "Apply" are different promises: one is a seat you buy, the other a slot
  // you are selected for. Saying "booking opens soon" on a pitch slot would imply the
  // wrong thing about how you get one.
  const isApplication = ticket.cta.toLowerCase() === 'apply'
  const heading = isApplication ? 'Applications open soon' : 'Booking opens soon'

  return (
    <div className="flex flex-col">
      {/* Same header as the live sheet — the click is acknowledged, not swallowed. */}
      <div className="flex items-start justify-between gap-4 bg-base px-6 py-5 text-surface sm:px-8">
        <div>
          <div className="font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-accent">
            {ticket.eyebrow}
          </div>
          <div className="mt-1 font-sans text-xl font-bold uppercase">{ticket.name}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-sans text-2xl font-bold leading-none">{formatTicketPrice(ticket)}</div>
          <div className="mt-1 font-sans text-[9px] font-bold uppercase tracking-[0.14em] text-surface/60">
            {ticket.unit}
          </div>
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="-mr-1 -mt-1 shrink-0 text-surface/70 transition-colors hover:text-surface"
        >
          <X size={22} />
        </button>
      </div>

      <div className="flex flex-col items-center px-6 py-10 text-center sm:px-10">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
          <Clock size={28} className="text-accent" />
        </span>

        <h3 className="mt-6 font-sans text-2xl font-bold uppercase text-ink">{heading}</h3>

        <p className="mt-3 max-w-sm text-muted">
          {isApplication ? (
            <>
              Applications for the <strong className="font-semibold text-ink">{ticket.name}</strong> aren&apos;t open
              just yet. Join the list and we&apos;ll come to you the moment slots are released — waitlist entries are
              reviewed first.
            </>
          ) : (
            <>
              Booking for the <strong className="font-semibold text-ink">{ticket.name}</strong> isn&apos;t open just
              yet. Join the list and we&apos;ll reach you first the moment passes go on sale.
            </>
          )}
        </p>

        {/* Subject line names the pass so the reply does not have to ask which one. */}
        <a
          href={`mailto:${site.contactEmail}?subject=${encodeURIComponent(
            `${isApplication ? 'Interest' : 'Waitlist'} — ${ticket.name}`,
          )}`}
          className="mt-7 flex w-full max-w-xs items-center justify-center gap-2 bg-accent py-4 font-sans text-btn font-bold uppercase text-accent-ink transition-colors hover:bg-base hover:text-surface"
        >
          {isApplication ? 'Register interest' : 'Join the waitlist'}
          <ArrowRight size={16} />
        </a>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 font-sans text-btn font-bold uppercase text-muted transition-colors hover:text-ink"
        >
          Back to tickets
        </button>

        <p className="mt-7 border-t border-ink/10 pt-5 text-xs text-muted">
          Questions in the meantime?{' '}
          <a href={`mailto:${site.contactEmail}`} className="font-medium text-accent hover:underline">
            {site.contactEmail}
          </a>{' '}
          · {site.contactPhone}
        </p>
      </div>
    </div>
  )
}

function CheckoutForm({ ticket, onClose }: { ticket: Ticket; onClose: () => void }) {
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  /** Set once money has definitely moved. Gates every failure path below. */
  const [paidNote, setPaidNote] = useState('')
  const [sector, setSector] = useState('')
  const [registerAs, setRegisterAs] = useState('')
  const [city, setCity] = useState('')
  const [phone, setPhone] = useState('')
  const [sectorError, setSectorError] = useState(false)
  const [registerAsError, setRegisterAsError] = useState(false)
  const [cityError, setCityError] = useState(false)
  const [phoneError, setPhoneError] = useState(false)
  const busy = useRef(false)

  /*
   * Warn before closing the tab mid-confirmation.
   *
   * The webhook covers this server-side so nothing is lost, but somebody who closes
   * here and sees no confirmation for a minute will assume it failed and pay again.
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

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (busy.current) return
    const fields = Object.fromEntries(new FormData(e.currentTarget))

    // Comboboxes are custom controls, so native required-validation cannot see them.
    const missingSector = !sector
    const missingRegisterAs = !registerAs
    const missingCity = !city
    const badPhone = !/^[6-9]\d{9}$/.test(phone)
    setSectorError(missingSector)
    setRegisterAsError(missingRegisterAs)
    setCityError(missingCity)
    setPhoneError(badPhone)
    if (missingSector || missingRegisterAs || missingCity || badPhone) return

    busy.current = true
    setStatus('sending')
    setErrorMsg('')

    try {
      // Only the ticket ID goes up. The server prices it — the browser never names an
      // amount, so there is nothing here to tamper with.
      const orderRes = await fetch('/api/payment/order', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...fields, ticketId: ticket.id }),
      })
      const order = (await orderRes.json().catch(() => null)) as
        | {
            ok?: boolean
            error?: string
            keyId?: string
            orderId?: string
            amount?: number
            currency?: string
            ticketName?: string
            prefill?: { name: string; email: string; contact: string }
          }
        | null

      if (!orderRes.ok || !order?.ok || !order.orderId || !order.keyId) {
        setErrorMsg(order?.error || '')
        setStatus('error')
        busy.current = false
        return
      }

      try {
        await loadCheckout()
      } catch {
        setErrorMsg('Could not reach the payment provider. Check your connection and try again.')
        setStatus('error')
        busy.current = false
        return
      }
      if (!window.Razorpay) {
        setErrorMsg('Could not start the payment window. Please try again.')
        setStatus('error')
        busy.current = false
        return
      }

      const rzp = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: site.fullName,
        description: `${order.ticketName || ticket.name} · ${site.dates}`,
        /*
         * Name, email and phone come from our own form, so Checkout must not ask for
         * them a second time.
         *
         * `prefill` alone only fills the boxes — Checkout still shows them and still
         * lets the payer edit, which is both an extra step and a data problem: a number
         * typed here goes onto Razorpay's payment record while OUR journal row, the
         * Sheet and the confirmation email all keep the one from the form. Reconciling
         * a payment to a registration by phone then fails on exactly the orders where
         * someone corrected themselves.
         *
         * `readonly` locks all three to the validated values, which collapses the
         * contact screen and makes the two records agree by construction. The server
         * builds `prefill.contact` as +91XXXXXXXXXX (normalisePhone, spaces stripped) —
         * Checkout ignores a contact it cannot parse, and silently falls back to
         * asking, so that format is load-bearing.
         */
        prefill: order.prefill,
        readonly: { name: true, email: true, contact: true },
        notes: { ticket: ticket.id },
        theme: { color: '#F47B20' },
        retry: { enabled: true, max_count: 3 },
        modal: {
          // Closing mid-payment with a bank page open is how people end up charged
          // with no record on our side.
          escape: false,
          ondismiss: () => {
            busy.current = false
            setErrorMsg('Payment cancelled — you have not been charged.')
            setStatus('error')
          },
        },
        handler: (res: RazorpayResponse) => {
          // Not awaited: Razorpay closes its modal when this returns, and holding it
          // open behind a network call looks like a freeze.
          void confirmPayment(res)
        },
      })

      rzp.on('payment.failed', (evt: unknown) => {
        busy.current = false
        const desc =
          (evt as { error?: { description?: string } } | null)?.error?.description ||
          'The payment did not go through.'
        // Razorpay only emits this for genuinely failed attempts, so no money moved
        // and an error is honest here.
        setErrorMsg(`${desc} You have not been charged — please try again.`)
        setStatus('error')
      })

      rzp.open()
    } catch {
      setErrorMsg('')
      setStatus('error')
      busy.current = false
    }
  }

  /**
   * Everything below runs AFTER the customer has been charged.
   *
   * There is deliberately no path here that reports a failure, with one exception. Once
   * Razorpay has handed us a payment id the money has moved, and the webhook records it
   * independently of this request — so an error shown here would be describing our own
   * bookkeeping, not their payment, and the only thing it could make them do is pay
   * twice. The exception is a 402, which is the single post-Checkout case where the
   * charge genuinely did not complete.
   */
  async function confirmPayment(response: RazorpayResponse) {
    setStatus('confirming')
    try {
      const res = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(response),
      })
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; recorded?: boolean; message?: string; error?: string }
        | null

      if (data?.ok) {
        setPaidNote(data.message || '')
        setStatus('done')
        return
      }
      // 402 is the one post-Checkout case where the money genuinely did not move.
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
    } catch {
      // The browser could not reach us, but Razorpay has the payment and the webhook
      // is independent of this request. Reassure, never alarm.
      setPaidNote(
        'Your payment was submitted. Our confirmation email is on its way — please do not pay again. ' +
          `If you have not heard within an hour, contact ${site.contactEmail}.`,
      )
      setStatus('done')
    } finally {
      busy.current = false
    }
  }

  if (status === 'done') {
    return (
      <div className="flex flex-col items-center px-6 py-12 text-center sm:px-10">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent">
          <Check size={30} strokeWidth={3} className="text-accent-ink" />
        </span>
        <h3 className="mt-6 font-sans text-2xl font-bold uppercase text-ink">You&apos;re in.</h3>
        <p className="mt-2 max-w-sm text-muted">
          {paidNote ||
            `Payment received for the ${ticket.name}. Your receipt is on its way to your inbox — see you in ${site.city.split(',')[0]}.`}
        </p>
        <button
          onClick={onClose}
          className="mt-6 font-sans text-btn font-bold uppercase text-accent hover:underline"
        >
          Close
        </button>
      </div>
    )
  }

  const submitting = status === 'sending' || status === 'confirming'

  return (
    <form onSubmit={onSubmit} className="flex flex-col">
      {/* Ticket summary — what they are buying and for how much, never out of sight. */}
      <div className="flex items-start justify-between gap-4 bg-base px-6 py-5 text-surface sm:px-8">
        <div>
          <div className="font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-accent">
            {ticket.eyebrow}
          </div>
          <div className="mt-1 font-sans text-xl font-bold uppercase">{ticket.name}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-sans text-2xl font-bold leading-none">{formatTicketPrice(ticket)}</div>
          <div className="mt-1 font-sans text-[9px] font-bold uppercase tracking-[0.14em] text-surface/60">
            {ticket.unit}
          </div>
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="-mr-1 -mt-1 shrink-0 text-surface/70 transition-colors hover:text-surface"
        >
          <X size={22} />
        </button>
      </div>

      <div className="flex flex-col gap-4 px-6 py-6 text-ink sm:px-8 sm:py-7">
        <Field label="Name">
          <input name="name" type="text" required placeholder="Your full name" className={input} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email">
            <input name="email" type="email" required placeholder="you@email.com" className={input} />
          </Field>
          <Field label="Phone no">
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
            {phoneError && <span className="text-xs font-medium text-accent">Enter a 10-digit mobile number.</span>}
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
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
        </div>

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

        <label className="mt-1 flex items-start gap-3 text-sm text-muted">
          <input type="checkbox" name="updates" defaultChecked className="mt-0.5 h-4 w-4 shrink-0 accent-accent" />
          <span>Keep me posted about the agenda and speaker announcements.</span>
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 flex items-center justify-center gap-2 bg-accent py-4 font-sans text-btn font-bold uppercase text-accent-ink transition-colors hover:bg-base hover:text-surface disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting && <Loader2 size={16} className="animate-spin" />}
          {status === 'confirming'
            ? 'Confirming payment…'
            : status === 'sending'
              ? 'Starting payment…'
              : `Pay ${formatTicketPrice(ticket)}`}
        </button>

        <p className="flex items-center justify-center gap-1.5 text-xs text-muted">
          <ShieldCheck size={13} />
          Secure payment by Razorpay · UPI, cards, net banking
        </p>

        {/* Only ever rendered when no money has moved — see confirmPayment(). */}
        {status === 'error' && (
          <p className="text-sm font-medium text-accent">
            {errorMsg || 'Something went wrong'} — please try again, or email {site.contactEmail}.
          </p>
        )}
      </div>
    </form>
  )
}

const input =
  'w-full border border-ink/15 bg-foam px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-muted/70 focus:border-accent focus:bg-surface'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-sans text-xs font-bold uppercase tracking-[0.12em] text-muted">{label}</span>
      {children}
    </label>
  )
}
