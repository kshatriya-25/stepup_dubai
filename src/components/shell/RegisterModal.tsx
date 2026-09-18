'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { X, ArrowLeft, ArrowRight, Ticket as TicketIcon, Rocket } from 'lucide-react'
import { cn } from '@/lib/cn'
import {
  visitorTickets,
  isPitchPass,
  formatTicketPrice,
  formatTicketListPrice,
  hasOffer,
  isFreePass,
  OFFER_LABEL,
  type Ticket,
} from '@/content/tickets'

/**
 * REGISTER — ask what someone is here to do before showing them a price list.
 *
 * The button used to be an anchor to #tickets: it scrolled the reader to four cards and
 * left them to work out which of the four was theirs. Four options presented at once is
 * the wrong question, because they are not four comparable products — three of them admit
 * you to the event and the fourth puts your company in front of investors. Somebody who
 * came to pitch does not want to read about lunch coupons, and somebody who came to walk
 * the stalls does not want to be sold the founder track.
 *
 * So this asks the one question that actually splits the audience — visiting, or
 * pitching — and then shows only the passes that answer it. Pitching is a single pass, so
 * that branch skips the list entirely and goes straight to its checkout.
 *
 *   Register ─┬─ Pitch my idea ─────────────────────────────────→ /passes/investor-pitch
 *             └─ I'm visiting ──→ Free / Delegate / Workshop ──→ /passes/<id>
 *
 * WHY A DIALOG AND NOT A PAGE. Unlike the checkout — which became /passes/[pass] because
 * it holds fifteen fields, four steps and a payment across a refresh — this holds one
 * decision and no input. It is reachable from the header on every page and from every
 * scroll position, and routing away to ask two questions would lose the reader's place on
 * a page they were part-way through. Nothing here is worth a URL; the destinations are.
 *
 * WHAT IT IS NOT. It is not a second pass catalogue. The homepage section still lists all
 * four in full, with what each one opens and what it excludes, and that is where someone
 * comparing passes should end up. This is a routing question with just enough detail to
 * answer it — a name, a line, and a price.
 *
 * WHICH IS ALSO WHY IT NEVER SAYS "BOOK NOW" OR "JOIN THE WAITLIST". Those words depend on
 * REGISTRATION_PAYMENT_ENABLED, a server env var, and this provider is mounted in the ROOT
 * LAYOUT — which /_not-found prerenders statically, freezing whatever the till happened to
 * be at build time. Rather than ship a dialog that is honest on two routes and stale on a
 * third, it states only what cannot go stale: the pass, what it opens, and the price. The
 * checkout page one click away resolves the till per request and says the rest.
 */

const Ctx = createContext<{ open: () => void; close: () => void } | null>(null)

export function useRegister() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useRegister must be used within RegisterProvider')
  return ctx
}

/** choose = visiting or pitching; visitor = the three visitor passes. */
type View = 'choose' | 'visitor'

export function RegisterProvider({
  tickets,
  children,
}: {
  /*
   * PRICED passes, resolved on the server and handed down — see the layout.
   *
   * Not imported from @/content/tickets directly, even though that file is safe to import
   * from client code. This is a client component, so it cannot read the staging price
   * override in @/lib/pricing (which is server-only by construction), and a dialog quoting
   * ₹299 in front of a checkout that charges ₹2 is exactly the drift that override exists
   * to make visible rather than silent.
   */
  tickets: Ticket[]
  children: ReactNode
}) {
  const [isOpen, setOpen] = useState(false)
  const [view, setView] = useState<View>('choose')
  const panelRef = useRef<HTMLDivElement | null>(null)
  // Where focus came from, so it can be handed back. Without this a keyboard user who
  // closes the dialog is returned to the top of the document with no idea where they were.
  const openerRef = useRef<HTMLElement | null>(null)

  const close = useCallback(() => setOpen(false), [])

  const open = useCallback(() => {
    openerRef.current = document.activeElement as HTMLElement | null
    setOpen(true)
  }, [])

  /*
   * Escape closes; it does not step back.
   *
   * Escape means "dismiss this dialog" everywhere else on the web, and overloading it as
   * a back button for one two-step flow would make it mean something different here than
   * it does in the Partner dialog next to it. Going back is what the Back control is for.
   */
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, close])

  /*
   * Lock the page behind the dialog, and restore whatever overflow was there before —
   * not a hard-coded '', which would quietly undo any other lock that had been applied.
   */
  useEffect(() => {
    if (!isOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [isOpen])

  // Move focus into the panel on open, hand it back on close.
  useEffect(() => {
    if (isOpen) {
      const t = window.setTimeout(() => panelRef.current?.focus(), 0)
      return () => window.clearTimeout(t)
    }
    openerRef.current?.focus()
    openerRef.current = null
  }, [isOpen])

  /*
   * Reopening starts at the question again, after the exit animation has finished.
   *
   * Resetting synchronously would swap the panel's contents while it is still fading out,
   * which reads as a glitch on the way to a closed dialog nobody is looking at any more.
   */
  useEffect(() => {
    if (isOpen) return
    const t = window.setTimeout(() => setView('choose'), 250)
    return () => window.clearTimeout(t)
  }, [isOpen])

  const visitors = visitorTickets(tickets)
  const pitch = tickets.find(isPitchPass)

  return (
    <Ctx.Provider value={{ open, close }}>
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
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="register-dialog-title"
              tabIndex={-1}
              /* Navy panel under a 4px accent rule — the same treatment as the header's
                 dropdown, and sharp-cornered like everything else on this site. The
                 Partner dialog is an orange block because it is a single form; this one
                 holds pass rows that carry their own accent colours, and an orange ground
                 would fight every one of them. */
              className="my-auto w-full max-w-2xl border-t-4 border-accent bg-base text-surface shadow-2xl outline-none"
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="flex items-start justify-between gap-4 px-6 pt-6 sm:px-10 sm:pt-9">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="h-[2px] w-7 bg-accent" />
                    <span className="font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
                      {view === 'choose' ? 'Register' : 'Visitor passes'}
                    </span>
                  </div>
                  <h2
                    id="register-dialog-title"
                    className="mt-3 font-sans text-2xl font-bold uppercase leading-none tracking-[-0.01em] sm:text-3xl"
                  >
                    {view === 'choose' ? 'What brings you here?' : 'Pick your pass'}
                  </h2>
                </div>
                <button
                  aria-label="Close"
                  onClick={close}
                  className="-mr-1 shrink-0 text-surface/70 transition-colors hover:text-accent"
                >
                  <X size={26} />
                </button>
              </div>

              <div className="px-6 pb-7 pt-6 sm:px-10 sm:pb-10 sm:pt-7">
                {view === 'choose' && (
                  <>
                    <p className="max-w-md text-sm leading-relaxed text-surface/70">
                      Two ways in. Pick the one that describes you and we&apos;ll show you only the
                      passes that apply.
                    </p>

                    {/* PITCH FIRST, on the client's instruction. It is also the order the
                        rest of the site argues for: the founder track is the reason the
                        summit exists and the only branch that is a single decision, so a
                        founder lands on their answer immediately and everyone else reads
                        one card before finding theirs. */}
                    <div className="mt-6 flex flex-col gap-3">
                      {pitch && (
                        <ChoiceCard
                          icon={<Rocket size={20} />}
                          eyebrow="Founder track"
                          title="Pitch my idea"
                          blurb="Pitch bootcamp, data scrutiny, investor connect and a closed-room one-on-one for eligible startups."
                          meta={`${pitch.name} · ${formatTicketPrice(pitch)} · ${pitch.unit}`}
                          href={`/passes/${pitch.id}/`}
                          onClick={close}
                        />
                      )}
                      <ChoiceCard
                        icon={<TicketIcon size={20} />}
                        eyebrow="Attending"
                        title="I'm visiting"
                        blurb="Walk the stall zone, sit in on the speaker sessions, add a workshop and the power networking corner."
                        meta={`${visitors.length} passes · from ${formatTicketPrice(
                          visitors.reduce((a, b) => (b.priceInr < a.priceInr ? b : a)),
                        )}`}
                        onClick={() => setView('visitor')}
                      />
                    </div>
                  </>
                )}

                {view === 'visitor' && (
                  <>
                    <button
                      onClick={() => setView('choose')}
                      className="-mt-1 mb-5 inline-flex items-center gap-1.5 font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-surface/60 transition-colors hover:text-accent"
                    >
                      <ArrowLeft size={14} /> Back
                    </button>

                    <div className="flex flex-col gap-3">
                      {visitors.map((t) => (
                        <PassRow key={t.id} ticket={t} onNavigate={close} />
                      ))}
                    </div>
                  </>
                )}

                {/*
                  `/#tickets`, not `#tickets`, and a Link rather than an anchor.

                  This dialog opens from the header, so it opens on EVERY route — including
                  /passes/[pass], where a bare "#tickets" resolves against the current URL,
                  finds no such element, and does nothing at all except append a hash. The
                  leading slash names the homepage section wherever the reader happens to
                  be; next/link keeps it a client navigation with the hash scroll intact
                  instead of a full document load.
                */}
                <p className="mt-6 border-t border-surface/15 pt-5 text-xs leading-relaxed text-surface/50">
                  Not sure yet?{' '}
                  <Link
                    href="/#tickets"
                    onClick={close}
                    className="font-semibold text-surface/80 underline decoration-accent underline-offset-4 hover:text-accent"
                  >
                    Compare all passes in full
                  </Link>{' '}
                  — what each one opens, and what it does not.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Ctx.Provider>
  )
}

/*
 * One shape, two behaviours: the visiting card advances a step, the pitching card is a
 * link to a checkout. They render identically on purpose — the reader is answering a
 * single question and should not have to notice that one answer navigates and the other
 * does not.
 */
const CARD =
  'group flex w-full items-center gap-4 border border-surface/15 bg-surface/[0.04] p-5 text-left transition-colors hover:border-accent hover:bg-surface/[0.07] focus-visible:border-accent focus-visible:outline-none sm:gap-5 sm:p-6'

function ChoiceCard({
  icon,
  eyebrow,
  title,
  blurb,
  meta,
  href,
  onClick,
}: {
  icon: ReactNode
  eyebrow: string
  title: string
  blurb: string
  meta: string
  href?: string
  onClick: () => void
}) {
  const body = (
    <>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-accent text-accent-ink">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-accent">
          {eyebrow}
        </span>
        <span className="mt-1.5 block font-sans text-lg font-bold uppercase leading-none tracking-[-0.01em] sm:text-xl">
          {title}
        </span>
        <span className="mt-2 block text-sm leading-snug text-surface/70">{blurb}</span>
        <span className="mt-2.5 block font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-surface/50">
          {meta}
        </span>
      </span>
      <ArrowRight
        size={20}
        className="shrink-0 self-center text-surface/40 transition-all group-hover:translate-x-1 group-hover:text-accent"
      />
    </>
  )

  return href ? (
    <Link href={href} onClick={onClick} className={CARD}>
      {body}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={CARD}>
      {body}
    </button>
  )
}

/**
 * One visitor pass. Name, the single line that distinguishes it from the rung below,
 * price, and what clicking it will do.
 *
 * `accessSummary` is the differentiator rather than `blurb`: the blurbs are written to
 * sell a card in isolation and all three open with the same stall-zone sentence, which is
 * useless when they are stacked three deep and the reader is scanning for the difference.
 */
function PassRow({ ticket, onNavigate }: { ticket: Ticket; onNavigate: () => void }) {
  return (
    <Link href={`/passes/${ticket.id}/`} onClick={onNavigate} className={cn(CARD, 'items-stretch')}>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-sans text-lg font-bold uppercase leading-none tracking-[-0.01em]">
            {ticket.name}
          </span>
          {/*
            `text-[1rem]`, NOT `text-base` — the same trap the header's nav links carry a
            note about.

            tailwind.config.ts defines `base` as a COLOUR (#072B5F, this panel's own navy)
            as well as a font size, so Tailwind emits `.text-base` twice. The colour rule
            is emitted after `.text-accent`, so it wins, and "₹299" rendered navy on navy —
            invisible. "Free" survived only because `.text-cyan` happens to be emitted
            later still, which is why the bug looked like it only hit the paid passes.
          */}
          <span
            className={cn(
              'font-sans text-[1rem] font-bold leading-none',
              isFreePass(ticket) ? 'text-cyan' : 'text-accent',
            )}
          >
            {formatTicketPrice(ticket)}
          </span>
          {hasOffer(ticket) && (
            <span className="font-sans text-xs font-semibold leading-none">
              <span className="sr-only">Regular price </span>
              <s className="tabular-nums text-surface/45">{formatTicketListPrice(ticket)}</s>
              <span className="ml-1.5 text-accent">{OFFER_LABEL}</span>
            </span>
          )}
        </span>
        <span className="mt-2 block text-sm leading-snug text-surface/70">{ticket.accessSummary}</span>
      </span>
      <ArrowRight
        size={20}
        className="shrink-0 self-center text-surface/40 transition-all group-hover:translate-x-1 group-hover:text-accent"
      />
    </Link>
  )
}
