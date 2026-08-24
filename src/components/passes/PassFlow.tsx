'use client'

import { useState } from 'react'
import { PassCheckout } from './PassCheckout'
import { PassSummary, MobileTotalBar } from './PassSummary'
import type { Ticket } from '@/content/tickets'

/**
 * Owns the one piece of state both columns need: how many extra team members.
 *
 * It lives here rather than in either column because both have to agree about it. The
 * form collects the members; the summary prices them. When the summary was rendered on
 * the server from the ticket alone it had no way to know, so adding a ₹999 member left
 * the total showing ₹2,999 — the form and the price silently disagreeing about what was
 * about to be charged.
 *
 * Only the COUNT is lifted, not the names and roles. Those are the form's business, and
 * hoisting them would mean every keystroke in a member's name re-rendered the summary for
 * no reason.
 */
export function PassFlow({ ticket, mode }: { ticket: Ticket; mode: 'pay' | 'waitlist' }) {
  const [extraCount, setExtraCount] = useState(0)

  return (
    <>
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px] lg:gap-8">
        <div className="min-w-0">
          <PassCheckout ticket={ticket} mode={mode} onExtrasChange={setExtraCount} />
        </div>
        <aside>
          <PassSummary ticket={ticket} extraCount={extraCount} />
        </aside>
      </div>
      <MobileTotalBar ticket={ticket} extraCount={extraCount} />
    </>
  )
}
