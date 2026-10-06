'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { PassCheckout } from './PassCheckout'
import { PassSummary, MobileTotalBar } from './PassSummary'
import { CouponField, tidyCouponCode } from './CouponField'
import type { AppliedDiscount } from '@/lib/order-total'
import { isFreePass, type Ticket } from '@/content/tickets'

/**
 * Owns everything both columns have to agree about: how many extra team members, and the
 * coupon.
 *
 * It lives here rather than in either column because both of them show it. The form
 * collects the members; the summary prices them. When the summary was rendered on the
 * server from the ticket alone it had no way to know, so adding a ₹999 member left the
 * total showing ₹2,999 — the form and the price silently disagreeing about what was about
 * to be charged. A coupon is the same problem with a worse failure: a discount visible in
 * one place and absent from the other is two claims about one amount on one screen.
 *
 * THE COUPON IS OWNED HERE RATHER THAN BY THE BOX ITSELF because the box is rendered
 * twice — once in the summary rail, which is where the money is, and once inside the
 * form's own money panel for phones, where the rail sits below the Pay button and a code
 * applied down there would be applied after the decision it was meant to change. Two
 * copies with their own state would be two different coupons; two copies driven from here
 * are one coupon with two windows onto it.
 *
 * Only the COUNT is lifted, not the members' names and roles, and only the VALIDATED
 * coupon plus the string being typed — never the rest of the form. Hoisting keystrokes
 * would re-render the summary on every one of them for no change in the total.
 */
export function PassFlow({ ticket, mode }: { ticket: Ticket; mode: 'pay' | 'waitlist' }) {
  const [extraCount, setExtraCount] = useState(0)

  /*
   * The email, for a once-per-person code — and ONLY when it is a plausible address.
   *
   * PassCheckout reports it on every keystroke, which would be a re-render of this whole
   * subtree per character; reporting '' for everything that is not yet an address means
   * React sees the same value and bails out, so in practice this changes once, when they
   * finish typing. See onEmailChange there.
   */
  const [email, setEmail] = useState('')

  /** What is typed in the box. Saved with the rest of the form's draft — see PassCheckout. */
  const [couponCode, setCouponCode] = useState('')
  /** What the SERVER said it is worth. The only thing that may price anything. */
  const [coupon, setCoupon] = useState<AppliedDiscount | null>(null)
  const [couponOpen, setCouponOpen] = useState(false)
  const [couponStatus, setCouponStatus] = useState<'idle' | 'checking' | 'error'>('idle')
  const [couponError, setCouponError] = useState('')

  // Coupons only mean anything where money is actually taken. In waitlist mode nothing is
  // charged and a free pass has no price, so the box is not offered at all.
  const canCoupon = mode === 'pay' && !isFreePass(ticket)

  const inFlight = useRef(false)

  /**
   * Ask the server what a code is worth, and apply its answer.
   *
   * `silent` is for the re-checks nobody asked for — a restored draft, a changed subtotal.
   * Those must not flash "Checking" over a page the visitor is reading, but they must still
   * be able to TAKE A DISCOUNT AWAY: a failed re-check clears the coupon and says why,
   * because the alternative is showing a saving that /api/payment/order will refuse.
   */
  const applyCoupon = useCallback(
    async (raw: string, opts: { silent?: boolean } = {}) => {
      const wanted = tidyCouponCode(raw)
      if (!wanted || inFlight.current) return
      inFlight.current = true
      if (!opts.silent) {
        setCouponStatus('checking')
        setCouponError('')
      }
      try {
        const res = await fetch('/api/payment/coupon', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            ticketId: ticket.id,
            code: wanted,
            extraMembers: String(extraCount),
            email: email || undefined,
          }),
        })
        const data = (await res.json().catch(() => null)) as {
          ok?: boolean
          error?: string
          code?: string
          label?: string
          discountPaise?: number
        } | null

        if (data?.ok && data.code && data.label && data.discountPaise) {
          setCoupon({ code: data.code, label: data.label, discountPaise: data.discountPaise })
          setCouponCode(data.code)
          setCouponStatus('idle')
          setCouponError('')
          return
        }
        setCoupon(null)
        setCouponOpen(true)
        setCouponStatus('error')
        setCouponError(data?.error || 'We could not check that code. Please try again.')
      } catch {
        setCoupon(null)
        setCouponOpen(true)
        setCouponStatus('error')
        setCouponError('We could not reach the server to check that code. Please try again.')
      } finally {
        inFlight.current = false
      }
    },
    [ticket.id, extraCount, email],
  )

  const clearCoupon = useCallback(() => {
    setCoupon(null)
    setCouponCode('')
    setCouponStatus('idle')
    setCouponError('')
    setCouponOpen(true)
  }, [])

  /*
   * RE-PRICE A LIVE COUPON WHEN WHAT IT SITS ON MOVES.
   *
   * A percentage is a percentage OF something: adding a paid team member after applying one
   * would otherwise leave yesterday's rupee figure on a larger subtotal, which is the page
   * quietly disagreeing with the server about the total — and the server wins. The email is
   * in here for the same reason: a once-per-person code can only be judged once we know
   * whose person it is.
   *
   * No pass sells paid extras today, so the first half of this does not fire. It is here
   * because the day one does is not the day anybody will remember that the discount was a
   * fixed number.
   */
  useEffect(() => {
    if (coupon) void applyCoupon(coupon.code, { silent: true })
    // Only when the basis changes — adding `coupon` would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extraCount, email])

  /*
   * A CODE OUT OF A RESTORED DRAFT IS RE-CHECKED, NOT TRUSTED.
   *
   * The draft lasts a week, and a coupon can expire or be fully claimed inside it. Carrying
   * the discount itself in storage would mean a browser closed for six days reopening with a
   * saving the server refuses, discovered at the Pay button. So the draft keeps the code —
   * the thing they typed — and the server is asked again. Once, hence the ref.
   */
  const rechecked = useRef(false)
  useEffect(() => {
    if (rechecked.current || coupon || !couponCode || !canCoupon) return
    rechecked.current = true
    setCouponOpen(true)
    void applyCoupon(couponCode, { silent: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [couponCode, coupon, canCoupon])

  const field = (tone: 'dark' | 'light') =>
    canCoupon ? (
      <CouponField
        tone={tone}
        open={couponOpen}
        onOpenChange={setCouponOpen}
        code={couponCode}
        onCodeChange={(next) => {
          setCouponCode(next)
          if (couponStatus === 'error') {
            setCouponStatus('idle')
            setCouponError('')
          }
        }}
        applied={coupon}
        status={couponStatus}
        error={couponError}
        onApply={(c) => void applyCoupon(c)}
        onClear={clearCoupon}
      />
    ) : null

  return (
    <>
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px] lg:gap-8">
        <div className="min-w-0">
          <PassCheckout
            ticket={ticket}
            mode={mode}
            onExtrasChange={setExtraCount}
            onEmailChange={setEmail}
            coupon={coupon}
            couponCode={couponCode}
            onCouponCodeRestore={setCouponCode}
            onCouponRejected={clearCoupon}
            // The phone copy. Hidden from `lg` up, where the rail's copy takes over — only
            // one of the two is ever on screen.
            couponSlot={<div className="lg:hidden">{field('light')}</div>}
          />
        </div>
        <aside>
          <PassSummary
            ticket={ticket}
            extraCount={extraCount}
            coupon={coupon}
            couponSlot={<div className="hidden lg:block">{field('dark')}</div>}
          />
        </aside>
      </div>
      <MobileTotalBar ticket={ticket} extraCount={extraCount} coupon={coupon} />
    </>
  )
}
