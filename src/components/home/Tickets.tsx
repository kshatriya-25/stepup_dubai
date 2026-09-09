import Link from 'next/link'
import { Check, ArrowRight, Clock } from 'lucide-react'
import { Container } from '@/components/primitives/Container'
import { Reveal } from '@/components/primitives/Reveal'
import { TestPriceBanner } from '@/components/primitives/TestPriceBanner'
import { cn } from '@/lib/cn'
import { site } from '@/content/site'
import { pricedTickets, priceOverrideInr } from '@/lib/pricing'
import {
  ticketsNote,
  TICKET_SALES_LIVE,
  passesIntro,
  formatTicketPrice,
  formatInrRupees,
  isFreePass,
  type Ticket,
} from '@/content/tickets'

/**
 * "Pass categories & access" — the four-rung pass ladder.
 *
 * Each card leads with WHAT THE PASS OPENS, because that is the only question a reader
 * actually has: the rungs are supersets of each other, and a price on its own does not
 * say what the next ₹700 buys. So the included list is printed in full on every card
 * rather than as "everything above, plus…", and what a pass does NOT open is stated
 * explicitly underneath. A reader comparing two cards should never have to hold the
 * cheaper pass's contents in their head.
 *
 * THREE THINGS DECIDE WHAT A CARD DOES, and they are not the same thing:
 *
 *   isFreePass(ticket)                           — the pass has no price at all.
 *   TICKET_SALES_LIVE (@/content/tickets, code)  — the shopfront.
 *   REGISTRATION_PAYMENT_ENABLED (server env)    — the till.
 *
 * Free pass            -> always the registration form. Razorpay is never involved,
 *                         under any combination of the other two.
 * Shopfront shut       -> "booking opens soon" panel.
 * Shopfront open,
 *   till closed        -> the same form, in waitlist mode. Nothing is charged and the
 *                         sheet row is written with Payment Status "Waitlist".
 * Both open            -> the same form, in pay mode, then Razorpay.
 *
 * ONE FORM, TWO MODES — see PassForm. It was two near-identical components; with
 * per-pass field groups on top that would have been two copies of the same conditional
 * logic, drifting apart on the first change to either.
 */

const ACCENT_RULE: Record<Ticket['accent'], string> = {
  accent: 'bg-accent',
  cyan: 'bg-cyan',
  green: 'bg-green',
  gold: 'bg-gold',
}

const ACCENT_TEXT: Record<Ticket['accent'], string> = {
  accent: 'text-accent',
  cyan: 'text-cyan',
  green: 'text-green',
  gold: 'text-gold',
}

export function Tickets({ paymentEnabled }: { paymentEnabled: boolean }) {
  // Every paid pass is a waitlist request when either switch is off. The free pass is
  // always one, so it does not make the whole section read as closed.
  const waitlistOnly = !TICKET_SALES_LIVE || !paymentEnabled


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
              Admit one · {site.city.split(',')[0]} · {site.datesCompact}
            </span>
          </div>
          <h2 className="mt-4 font-sans text-4xl font-bold uppercase leading-[1.02] tracking-[-0.01em] md:text-6xl">
            Pass categories
            <br />
            <span className="text-accent">&amp; access</span>
          </h2>
          <p className="mt-5 max-w-2xl text-lg text-surface/80">{passesIntro}</p>

          {/* Said once, at the top, rather than four times on four cards. Someone
              scanning prices should learn that nothing is on sale yet BEFORE they pick a
              pass and find out — that is the difference between a clear queue and a
              bait-and-switch. */}
          {waitlistOnly && (
            <p className="mt-6 flex max-w-2xl items-start gap-3 border-l-2 border-accent bg-surface/5 px-4 py-3 text-sm leading-relaxed text-surface/85">
              <Clock size={16} className="mt-0.5 shrink-0 text-accent" />
              <span>
                <strong className="font-semibold text-surface">Booking isn&apos;t open yet.</strong> Prices are
                confirmed, and you can join the waitlist for any pass now — we&apos;ll come to you first the moment
                it goes on sale. Nothing is charged today.
              </span>
            </p>
          )}

          {/* Above the cards, not below them: the prices are the thing it is qualifying. */}
          {priceOverrideInr !== null && (
            <TestPriceBanner priceInr={priceOverrideInr} className="mt-6 max-w-2xl" />
          )}
        </Reveal>

        <div className="mt-10 flex flex-col gap-5 md:mt-12">
          {pricedTickets.map((t, i) => (
            <Reveal key={t.id} delay={i * 0.08}>
              <TicketCard ticket={t} paymentEnabled={paymentEnabled} />
            </Reveal>
          ))}
        </div>

        <p className="mt-6 text-sm text-surface/55">{ticketsNote}</p>
      </Container>

    </section>
  )
}

function TicketCard({ ticket, paymentEnabled }: { ticket: Ticket; paymentEnabled: boolean }) {
  /*
   * The label says what the next page will actually do.
   *
   * This is resolved on the SERVER from the same env var the checkout page reads, so the
   * two can never disagree. It was briefly a client-side probe, which meant a card could
   * render "Book now", the probe could answer late, and the word could change under the
   * reader's cursor.
   *
   * A free pass never reaches Razorpay, so the till has no bearing on it — but it does not
   * say "waitlist" either. "Register for free" is what it reads, on the client's
   * instruction, because "join the waitlist" made a pass that costs nothing sound like
   * something being rationed before you have even asked for it.
   *
   * KEEP THIS IN STEP WITH PassCheckout's submit button. The same three inputs decide both
   * labels, and a card that promises "Register for free" leading to a button that says
   * "Join the waitlist" is the reader's first sign that nobody checked.
   */
  const free = isFreePass(ticket)
  const label = free ? 'Register for free' : !TICKET_SALES_LIVE || !paymentEnabled ? 'Join the waitlist' : 'Book now'

  return (
    <article className="relative flex flex-col bg-surface text-ink sm:flex-row">
      {/* Body */}
      <div className="flex-1 p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className={cn('h-[3px] w-7', ACCENT_RULE[ticket.accent])} />
          <span className="font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
            {ticket.eyebrow}
          </span>
        </div>

        <h3 className="mt-3 font-sans text-2xl font-bold uppercase leading-none tracking-[-0.01em] text-ink md:text-3xl">
          {ticket.name}
        </h3>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">{ticket.blurb}</p>

        {/* What it opens */}
        <p className="mt-6 border-t border-ink/10 pt-5 font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-muted/70">
          What it opens
        </p>
        <ul className="mt-3 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
          {ticket.includes.map((f) => (
            <li key={f.label} className="flex gap-2.5">
              <Check size={15} strokeWidth={3} className={cn('mt-[3px] shrink-0', ACCENT_TEXT[ticket.accent])} />
              <span className="text-sm leading-snug">
                <span className="font-semibold text-ink">{f.label}</span>{' '}
                <span className="text-muted">— {f.detail}</span>
              </span>
            </li>
          ))}
        </ul>

        {/* What it does not. Stated, not left to inference. */}
        {ticket.excludes && (
          <p className="mt-5 border-t border-dashed border-ink/10 pt-4 text-sm text-muted/80">
            <span className="font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-muted/60">
              Not included
            </span>
            <br />
            {ticket.excludes}
          </p>
        )}

        {ticket.note && (
          <p className="mt-4 border-l-2 border-accent bg-foam px-4 py-3 text-xs leading-relaxed text-muted">
            {ticket.note}
          </p>
        )}
      </div>

      {/* Perforation + stub */}
      <div className="relative flex shrink-0 items-center justify-center p-6 sm:w-[230px] sm:p-8">
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
          <div className="font-sans text-4xl font-bold uppercase leading-none tracking-[-0.02em] text-ink">
            {formatTicketPrice(ticket)}
          </div>
          <div className="mt-1.5 font-sans text-[9px] font-bold uppercase tracking-[0.14em] text-muted">
            {ticket.unit}
          </div>

          {/* The second price is part of the offer, not a footnote — a three-person
              startup is looking at ₹4,997, and finding that out at checkout is worse
              than reading it here. */}
          {ticket.extraMemberInr && (
            <div className="mt-3 w-full border-t border-dashed border-ink/15 pt-3">
              <div className="font-sans text-xl font-bold leading-none text-ink">
                {formatInrRupees(ticket.extraMemberInr)}
              </div>
              <div className="mt-1 font-sans text-[9px] font-bold uppercase tracking-[0.14em] text-muted">
                For each extra person
              </div>
            </div>
          )}

          {/* A link, not a button: it navigates. That makes middle-click, cmd-click and
              "open in new tab" work, and gives the pass a URL somebody can send to a
              co-founder — neither of which a dialog trigger could do. */}
          <Link
            href={`/passes/${ticket.id}/`}
            className={cn(
              'mt-4 flex w-full items-center justify-center gap-1.5 py-3 font-sans text-sm font-bold transition-colors',
              ticket.emphasis === 'solid'
                ? 'bg-accent text-accent-ink hover:bg-base hover:text-surface'
                : 'border border-base text-base hover:bg-base hover:text-surface',
            )}
          >
            {label}
            <ArrowRight size={15} />
          </Link>

          <div className="mt-3 font-sans text-[9px] font-bold uppercase tracking-[0.14em] text-muted/70">
            {ticket.badge}
          </div>
        </div>
      </div>
    </article>
  )
}

