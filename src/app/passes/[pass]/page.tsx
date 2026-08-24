import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ChevronLeft, Clock, ArrowRight } from 'lucide-react'
import { Container } from '@/components/primitives/Container'
import { PassFlow } from '@/components/passes/PassFlow'
import { PassSummary } from '@/components/passes/PassSummary'
import { site } from '@/content/site'
import { paymentEnabled } from '@/lib/payments/razorpay'
import { ticketById, isFreePass, TICKET_SALES_LIVE, type Ticket } from '@/content/tickets'

/**
 * /passes/[pass] — one checkout page per pass.
 *
 * THIS REPLACED A MODAL, and the reasons are structural rather than cosmetic. The form
 * asks up to fifteen questions across four steps and ends in a payment; a dialog could
 * not give it a URL, survive a refresh, restore on Back, or keep its submit button clear
 * of mobile Safari's address bar without a `dvh` height cap and a nested scroller.
 *
 * The layout is the standard commerce one: the flow on the left, an order summary pinned
 * on the right. The summary is not decoration — someone three steps into a ₹4,997
 * purchase needs to see what they are buying and what it costs without losing their
 * place, and on a modal there was nowhere to put that.
 *
 * WHY THIS IS `force-dynamic`
 * Whether the till is open is `REGISTRATION_PAYMENT_ENABLED`, a server-only env var. On a
 * statically prerendered page its value would be frozen into the HTML at build time, so
 * flipping it would need a rebuild rather than a restart. Rendering per request reads it
 * live — and it also deletes the client-side probe of /api/payment/order that the modal
 * needed, along with the "not answered yet" state that came with it.
 *
 * A checkout page should not be cached anyway.
 */
export const dynamic = 'force-dynamic'

/*
 * There is deliberately NO generateStaticParams here.
 *
 * It was, listing the four passes — and it silently defeated `force-dynamic`: Next
 * prerendered all four at build time (they showed as `●` rather than `ƒ`), which baked
 * REGISTRATION_PAYMENT_ENABLED into the HTML and put us straight back to needing a
 * rebuild to open or close the till. Verify with `npm run build`: this route must report
 * `ƒ`, not `●`.
 *
 * Nothing is lost. The pass list is four rows of static content already prerendered on
 * the homepage, and a checkout page has nothing worth caching.
 */

export async function generateMetadata({
  params,
}: {
  params: { pass: string }
}): Promise<Metadata> {
  const ticket = ticketById(params.pass)
  if (!ticket) return { title: 'Pass not found' }
  return {
    title: `${ticket.name} — ${site.fullName}`,
    description: ticket.blurb,
    // A checkout URL has no business in a search index: it is a step in a flow, not a
    // destination, and an indexed one competes with the pass section that should rank.
    robots: { index: false, follow: true },
  }
}

export default function PassPage({ params }: { params: { pass: string } }) {
  const ticket = ticketById(params.pass)
  if (!ticket) notFound()

  // The free pass has no price, so no combination of switches can make it a purchase.
  const mode: 'pay' | 'waitlist' = !isFreePass(ticket) && paymentEnabled ? 'pay' : 'waitlist'
  const shopShut = !TICKET_SALES_LIVE && !isFreePass(ticket)

  return (
    <main className="min-h-screen bg-foam pb-16 pt-8 md:pb-24 md:pt-12">
      <Container wide>
        <Link
          href="/#tickets"
          className="inline-flex items-center gap-1.5 font-sans text-sm font-semibold text-muted transition-colors hover:text-ink"
        >
          <ChevronLeft size={16} />
          All passes
        </Link>

        <div className="mt-5">
          <div className="mb-5">
            <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
              {ticket.eyebrow}
            </p>
            <h1 className="mt-1.5 font-sans text-3xl font-bold tracking-[-0.02em] text-ink md:text-4xl">
              {ticket.name}
            </h1>
          </div>

          {/*
            The two columns are inside ONE client component, because the summary has to
            know how many team members the form has collected — see PassFlow. When the
            summary was server-rendered here it priced the pass from the catalogue alone
            and never moved.

            The shopfront-shut case has no form and so needs no shared state; it keeps the
            server-rendered summary via PassFlow's own layout being bypassed entirely.
          */}
          {shopShut ? (
            <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px] lg:gap-8">
              <div className="min-w-0">
                <BookingSoon ticket={ticket} />
              </div>
              <aside>
                <PassSummary ticket={ticket} extraCount={0} />
              </aside>
            </div>
          ) : (
            <PassFlow ticket={ticket} mode={mode} />
          )}
        </div>
      </Container>
    </main>
  )
}

/**
 * Shown in place of the form while TICKET_SALES_LIVE is false — paid passes only.
 *
 * It does not dead-end. Somebody who clicked through to a ₹2,999 checkout has told us
 * they intend to come, and the worst possible answer is a message with nowhere to go.
 */
function BookingSoon({ ticket }: { ticket: Ticket }) {
  return (
    <div className="flex flex-col items-center border border-ink/10 bg-surface px-6 py-14 text-center sm:px-12">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
        <Clock size={26} className="text-accent" />
      </span>
      <h2 className="mt-6 font-sans text-2xl font-bold tracking-[-0.01em] text-ink">Booking opens soon</h2>
      <p className="mt-3 max-w-sm leading-relaxed text-muted">
        Booking for the <strong className="font-semibold text-ink">{ticket.name}</strong> isn&apos;t open just yet.
        Write to us and we&apos;ll reach you first the moment passes go on sale.
      </p>
      {/* Subject names the pass so the reply does not have to ask which one. */}
      <a
        href={`mailto:${site.contactEmail}?subject=${encodeURIComponent(`Waitlist — ${ticket.name}`)}`}
        className="mt-7 flex w-full max-w-xs items-center justify-center gap-2 bg-accent py-3.5 font-sans text-sm font-bold text-accent-ink transition-colors hover:bg-base hover:text-surface"
      >
        Email us
        <ArrowRight size={16} />
      </a>
      <Link href="/#tickets" className="mt-4 font-sans text-sm font-semibold text-muted hover:text-ink">
        Look at the other passes
      </Link>
    </div>
  )
}
