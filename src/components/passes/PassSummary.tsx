'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'
import { site } from '@/content/site'
import {
  formatTicketPrice,
  formatTicketListPrice,
  formatInrRupees,
  hasOffer,
  savingInr,
  isFreePass,
  ticketsNote,
  OFFER_LABEL,
  type Ticket,
} from '@/content/tickets'

/**
 * The order summary rail.
 *
 * IT IS A CLIENT COMPONENT BECAUSE THE TOTAL MOVES. It was server-rendered from the
 * ticket alone, which meant adding a team member on the Investor Pitch Pass changed the
 * price by ₹999 and the summary kept showing ₹2,999 — the one number in the whole layout
 * that must never be stale. The count is owned by PassFlow and handed to both sides, so
 * the form and the summary cannot disagree.
 *
 * LAYOUT: the card is a sticky flex COLUMN with a fixed head and a scrolling middle.
 *
 * It used to be `lg:sticky` alone, and that does nothing useful here: the "what it opens"
 * list runs to nine rows plus a note, so the card is taller than the viewport, and a
 * sticky element taller than its viewport just scrolls with the page. The price left the
 * screen at the exact moment the reader was changing it. Pinning the money and letting
 * only the feature list scroll is what makes the rail actually work.
 */
export function PassSummary({ ticket, extraCount }: { ticket: Ticket; extraCount: number }) {
  const extrasInr = ticket.extraMemberInr ? extraCount * ticket.extraMemberInr : 0
  const totalInr = ticket.priceInr + extrasInr
  const free = isFreePass(ticket)
  const itemised = !free && !!ticket.extraMemberInr && extraCount > 0

  return (
    <div className="border border-ink/10 bg-surface lg:sticky lg:top-6 lg:flex lg:max-h-[calc(100vh-3rem)] lg:flex-col">
      {/* ---- the money. Never scrolls. ---- */}
      <div className="shrink-0 bg-base px-5 py-4 text-surface">
        <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
          {free ? 'Your pass' : 'Order summary'}
        </p>

        {itemised ? (
          <>
            <div className="mt-3 flex items-baseline justify-between gap-3 text-sm">
              <span className="text-surface/80">{ticket.name}</span>
              <span className="tabular-nums text-surface/80">{formatInrRupees(ticket.priceInr)}</span>
            </div>
            <div className="mt-1.5 flex items-baseline justify-between gap-3 text-sm">
              <span className="text-surface/80">
                {extraCount} extra {extraCount === 1 ? 'person' : 'people'} ×{' '}
                {formatInrRupees(ticket.extraMemberInr!)}
              </span>
              <span className="tabular-nums text-surface/80">{formatInrRupees(extrasInr)}</span>
            </div>
            <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-surface/20 pt-3">
              <span className="font-sans text-sm font-semibold">
                Total · {extraCount + 1} {extraCount + 1 === 1 ? 'person' : 'people'}
              </span>
              <span className="font-sans text-2xl font-bold leading-none tabular-nums">
                {formatInrRupees(totalInr)}
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="mt-2 flex items-baseline justify-between gap-3">
              <span className="font-sans text-sm font-semibold">{ticket.name}</span>
              <span className="font-sans text-2xl font-bold leading-none tabular-nums">
                {formatTicketPrice(ticket)}
              </span>
            </div>
            {hasOffer(ticket) && (
              <p className="mt-1 text-right font-sans text-[11px] leading-tight">
                <span className="sr-only">Regular price </span>
                <s className="tabular-nums text-surface/50">{formatTicketListPrice(ticket)}</s>{' '}
                <span className="font-semibold text-accent">
                  {OFFER_LABEL} · save {formatInrRupees(savingInr(ticket))}
                </span>
              </p>
            )}
            <p className="mt-1 text-right font-sans text-[10px] text-surface/60">{ticket.unit}</p>
            {/* What the price covers. Kept for the co-founder pass now that it has no paid
                extras — "Founder + Co-founder" above is the claim, and this is the detail. */}
            {(ticket.includesCoFounder || ticket.extraMemberInr) && (
              <p className="mt-3 border-t border-surface/15 pt-3 text-xs leading-relaxed text-surface/70">
                {ticket.includesCoFounder
                  ? 'Covers two people — you and your co-founder. Tell us who is coming with your pitch details.'
                  : `${formatInrRupees(ticket.extraMemberInr!)} for each extra person from your startup — add them with your details and this total updates.`}
              </p>
            )}
          </>
        )}
      </div>

      {/* ---- what it opens. This is the part allowed to scroll. ---- */}
      <div className="px-5 py-5 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain">
        <p className="font-sans text-sm font-semibold text-ink">What it opens</p>
        <ul className="mt-3 flex flex-col gap-2">
          {ticket.includes.map((f) => (
            <li key={f.label} className="flex gap-2.5">
              <Check size={15} strokeWidth={3} className="mt-0.5 shrink-0 text-accent" />
              <span className="text-sm leading-snug">
                <span className="font-medium text-ink">{f.label}</span>
                <span className="block text-xs text-muted">{f.detail}</span>
              </span>
            </li>
          ))}
        </ul>

        {ticket.excludes && (
          <p className="mt-4 border-t border-dashed border-ink/10 pt-3 text-xs leading-relaxed text-muted">
            <span className="font-medium text-muted/80">Not included:</span> {ticket.excludes}
          </p>
        )}

        {ticket.note && (
          <p className="mt-4 border-l-2 border-accent bg-foam px-3 py-2.5 text-xs leading-relaxed text-muted">
            {ticket.note}
          </p>
        )}
      </div>

      {/* ---- fine print. Never scrolls, so the contact is always reachable. ---- */}
      <div className="shrink-0 border-t border-ink/10 px-5 py-4">
        <p className="text-xs leading-relaxed text-muted">{ticketsNote}</p>
        <p className="mt-2 text-xs text-muted">
          Questions?{' '}
          <a href={`mailto:${site.contactEmail}`} className="font-medium text-accent hover:underline">
            {site.contactEmail}
          </a>
        </p>
      </div>
    </div>
  )
}

/**
 * The same total, as a bar pinned to the bottom of the phone screen.
 *
 * On anything under `lg` the summary rail sits BELOW the form, so on a phone the price is
 * a long scroll away from the team-member fields that change it. This is the mobile
 * answer to the same problem the sticky rail solves on desktop.
 *
 * Only rendered when there is arithmetic worth watching — a fixed-price pass has nothing
 * to report that the rail above did not already say, and a bar that never changes is just
 * something covering the page.
 */
export function MobileTotalBar({ ticket, extraCount }: { ticket: Ticket; extraCount: number }) {
  if (isFreePass(ticket) || !ticket.extraMemberInr || extraCount < 1) return null
  const totalInr = ticket.priceInr + extraCount * ticket.extraMemberInr

  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-50 border-t border-ink/10 bg-surface/95 backdrop-blur lg:hidden',
        // Keeps the bar clear of the iPhone home indicator.
        'pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3',
      )}
    >
      <div className="mx-auto flex max-w-container-wide items-center justify-between px-4">
        <span className="font-sans text-xs text-muted">
          {extraCount + 1} people · {ticket.name}
        </span>
        <span className="font-sans text-lg font-bold tabular-nums text-ink">{formatInrRupees(totalInr)}</span>
      </div>
    </div>
  )
}
