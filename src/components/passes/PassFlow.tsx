'use client'

import { useState } from 'react'
import { PassCheckout } from './PassCheckout'
import { PassSummary, MobileTotalBar } from './PassSummary'
import type { AppliedDiscount } from '@/lib/order-total'
import type { Ticket } from '@/content/tickets'

/**
 * Owns the two pieces of state both columns need: how many extra team members, and which
 * coupon is applied.
 *
 * They live here rather than in either column because both have to agree about them. The
 * form collects them; the summary prices them. When the summary was rendered on the server
 * from the ticket alone it had no way to know, so adding a ₹999 member left the total
 * showing ₹2,999 — the form and the price silently disagreeing about what was about to be
 * charged. A coupon is the same problem with a worse failure: a discount visible in the
 * form and absent from the rail is two different claims about one amount on one screen.
 *
 * Only the COUNT is lifted, not the members' names and roles, and only the VALIDATED coupon,
 * not what is being typed into the box. Both for the same reason: hoisting the keystrokes
 * would re-render the summary on every one of them for no change in the total.
 */
export function PassFlow({ ticket, mode }: { ticket: Ticket; mode: 'pay' | 'waitlist' }) {
  const [extraCount, setExtraCount] = useState(0)
  const [coupon, setCoupon] = useState<AppliedDiscount | null>(null)

  return (
    <>
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px] lg:gap-8">
        <div className="min-w-0">
          <PassCheckout
            ticket={ticket}
            mode={mode}
            onExtrasChange={setExtraCount}
            coupon={coupon}
            onCouponChange={setCoupon}
          />
        </div>
        <aside>
          <PassSummary ticket={ticket} extraCount={extraCount} coupon={coupon} />
        </aside>
      </div>
      <MobileTotalBar ticket={ticket} extraCount={extraCount} coupon={coupon} />
    </>
  )
}
