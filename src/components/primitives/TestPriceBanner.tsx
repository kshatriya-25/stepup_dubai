import { FlaskConical } from 'lucide-react'

/**
 * "These prices are not real."
 *
 * Shown wherever money is displayed or taken while TICKET_PRICE_OVERRIDE_INR is in
 * effect — see @/lib/pricing for what that is and why it exists.
 *
 * IT IS DELIBERATELY UGLY. Every other surface on this site is navy, orange and foam;
 * this one is hazard yellow on near-black, because its whole job is to look like
 * scaffolding rather than design. Someone screenshotting the pass ladder for a deck, or
 * forwarding a checkout link to a founder, has to notice at a glance that they are on
 * the staging copy. A tasteful notice in brand colours is a notice people stop seeing.
 *
 * It is a server-safe plain component: the price arrives as a prop rather than being
 * read from the environment here, so nothing drags the server-only pricing module into
 * a client bundle.
 *
 * THE SECOND SENTENCE IS THE IMPORTANT ONE. On live keys a ₹2 payment is a real payment
 * — real card, real settlement, real refund needed. "Test pricing" alone would read as
 * "test money", which it is not.
 */
export function TestPriceBanner({ priceInr, className }: { priceInr: number; className?: string }) {
  return (
    <div
      className={`flex items-start gap-3 border-l-4 border-[#F5C518] bg-[#1A1A1A] px-4 py-3 text-surface ${className ?? ''}`}
    >
      <FlaskConical size={16} className="mt-0.5 shrink-0 text-[#F5C518]" />
      <p className="font-sans text-sm leading-relaxed">
        <span className="font-bold uppercase tracking-[0.1em] text-[#F5C518]">Staging — test pricing.</span>{' '}
        Every paid pass is ₹{priceInr} here so the payment gateway can be checked end to end. These are not the
        real prices, and any payment made on this site is a genuine charge that has to be refunded.
      </p>
    </div>
  )
}
