'use client'

import { useEffect, useRef, useState } from 'react'
import { BadgePercent, Check, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatPaise, type AppliedDiscount } from '@/lib/order-total'

/**
 * The coupon box.
 *
 * WHY IT ASKS THE SERVER INSTEAD OF CHECKING THE CODE ITSELF
 * The catalogue is server-side on purpose — a code compiled into the JavaScript the browser
 * downloads is a code on a forum by Friday. See the top of @/lib/coupons. So this component
 * knows nothing about which codes exist or what they are worth; it sends what was typed to
 * /api/payment/coupon and renders the answer. The same check runs again inside
 * /api/payment/order when the money moves, from the code string and not from anything here,
 * which is what makes it safe for this component to be as trusting as it looks.
 *
 * WHY IT IS VISIBLE RATHER THAN BEHIND A "HAVE A CODE?" LINK
 * These codes are handed out by partners, incubators and the Startup Singam community —
 * people arrive at the checkout already holding one and knowing they have it. Hiding the
 * field behind a disclosure costs exactly those people a hunt, and an unredeemed code that
 * somebody was given is a worse outcome than an empty box somebody ignored. It is quiet
 * instead: one line, pale, below the details and above the consent.
 *
 * WHAT IT DOES WITH A BAD CODE
 * Says why, in the server's own words — expired, fully claimed, wrong pass — and keeps what
 * was typed so a near miss can be corrected rather than retyped. It never silently drops a
 * code: when the order endpoint later refuses one (claimed in the seconds since, say), the
 * checkout clears the discount and shows the reason, so nobody is charged a figure other
 * than the one they were last shown.
 */

type Status = 'idle' | 'checking' | 'error'

export function CouponField({
  ticketId,
  extraMembers,
  email,
  code,
  onCodeChange,
  applied,
  onChange,
  disabled,
}: {
  ticketId: string
  /** Part of the amount the discount is taken of, so a change re-prices the coupon. */
  extraMembers: number
  /** Lets a once-per-person code be judged before checkout. Optional — see checkCoupon(). */
  email?: string
  /**
   * The typed code, owned by the form rather than by this box — which is what puts it in
   * the saved draft with every other answer. Somebody who applies a code, closes the tab and
   * comes back finds it still there; see DRAFT_KEY_PREFIX in ./PassCheckout.
   */
  code: string
  onCodeChange: (next: string) => void
  applied: AppliedDiscount | null
  onChange: (next: AppliedDiscount | null) => void
  disabled?: boolean
}) {
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')
  const inFlight = useRef(false)
  const box = useRef<HTMLInputElement>(null)

  /** Uppercase, alphanumeric — the same normalisation the server applies. */
  const tidy = (raw: string) =>
    raw
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 24)

  async function check(raw: string, opts: { silent?: boolean } = {}): Promise<void> {
    const wanted = tidy(raw)
    if (!wanted || inFlight.current) return
    inFlight.current = true
    if (!opts.silent) {
      setStatus('checking')
      setMessage('')
    }
    try {
      const res = await fetch('/api/payment/coupon', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ticketId, code: wanted, extraMembers: String(extraMembers), email }),
      })
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean
        error?: string
        code?: string
        label?: string
        discountPaise?: number
      } | null

      if (data?.ok && data.code && data.label && data.discountPaise) {
        onChange({ code: data.code, label: data.label, discountPaise: data.discountPaise })
        onCodeChange(data.code)
        setStatus('idle')
        setMessage('')
        return
      }
      // A re-check that fails takes the discount away — the alternative is showing a saving
      // the order endpoint will refuse to honour.
      onChange(null)
      setStatus('error')
      setMessage(data?.error || 'We could not check that code. Please try again.')
    } catch {
      onChange(null)
      setStatus('error')
      setMessage('We could not reach the server to check that code. Please try again.')
    } finally {
      inFlight.current = false
    }
  }

  /*
   * RE-PRICE A LIVE COUPON WHEN THE AMOUNT UNDER IT MOVES.
   *
   * A percentage is a percentage OF something. Adding a paid team member after applying one
   * would otherwise leave yesterday's rupee figure on a larger subtotal — the page quietly
   * disagreeing with the server about the total, which the server wins. Silent because
   * nothing the visitor did was wrong.
   *
   * No pass sells paid extras today, so this does not fire; it is here because the day one
   * does is not the day anybody will remember that the discount was a fixed number.
   */
  useEffect(() => {
    if (applied) void check(applied.code, { silent: true })
    // Only when the basis changes — re-running on `applied` would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extraMembers])

  /*
   * A CODE OUT OF A RESTORED DRAFT IS RE-CHECKED, NOT TRUSTED.
   *
   * The draft lasts a week (DRAFT_TTL_MS), and a coupon can expire or be fully claimed
   * inside it. Carrying the discount itself in storage would mean a browser that has been
   * closed for six days reopening with a saving the server will refuse, discovered at the
   * Pay button. So the draft keeps the code — the thing the visitor typed — and the server
   * is asked again the moment the box is on screen. Once, hence the ref: without it every
   * re-render of a restored form is another request.
   */
  const rechecked = useRef(false)
  useEffect(() => {
    if (rechecked.current || applied || !code) return
    rechecked.current = true
    void check(code, { silent: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, applied])

  function clear() {
    onChange(null)
    onCodeChange('')
    setStatus('idle')
    setMessage('')
    box.current?.focus()
  }

  /* ---- applied ------------------------------------------------------------------- */
  if (applied) {
    return (
      <div className="border border-green/40 bg-green/5 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <p className="flex min-w-0 items-start gap-2 text-sm">
            <Check size={15} strokeWidth={3} className="mt-0.5 shrink-0 text-green" />
            <span className="min-w-0">
              <span className="font-sans font-semibold text-ink">{applied.code}</span>
              <span className="text-muted"> applied</span>
              <span className="block text-xs leading-tight text-muted">
                {applied.label} · you save{' '}
                <strong className="font-semibold text-ink">{formatPaise(applied.discountPaise)}</strong>
              </span>
            </span>
          </p>
          <button
            type="button"
            onClick={clear}
            disabled={disabled}
            className="flex shrink-0 items-center gap-1 font-sans text-xs font-semibold text-muted underline-offset-2 transition-colors hover:text-accent hover:underline disabled:opacity-50"
          >
            <X size={13} /> Remove
          </button>
        </div>
      </div>
    )
  }

  /* ---- idle / checking / error ---------------------------------------------------- */
  return (
    <div>
      <label htmlFor="coupon" className="flex items-center gap-1.5 font-sans text-sm font-medium text-ink">
        <BadgePercent size={14} className="text-accent" />
        Coupon code
      </label>
      <p className="mt-0.5 text-xs text-muted">
        Partner, incubator or community code. Leave blank if you don’t have one.
      </p>
      <div className="mt-2 flex gap-2">
        <input
          id="coupon"
          ref={box}
          value={code}
          onChange={(e) => {
            onCodeChange(tidy(e.target.value))
            if (status === 'error') {
              setStatus('idle')
              setMessage('')
            }
          }}
          // The field is not inside a <form>, so Enter has nothing to submit — it is wired
          // here because typing a code and pressing Enter is what everyone does.
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void check(code)
            }
          }}
          disabled={disabled || status === 'checking'}
          autoComplete="off"
          spellCheck={false}
          inputMode="text"
          /*
           * NEVER PUT A LIVE CODE HERE. A placeholder is in the client bundle and on the
           * screen of everyone who reaches this step, so "e.g. SINGAM20" — which this said
           * first — is not an example, it is a 20% discount handed to every visitor whether
           * a partner gave them one or not. That is the entire reason the catalogue is
           * server-side (see @/lib/coupons); a placeholder would have walked it straight
           * back out again.
           */
          placeholder="Enter code"
          aria-invalid={status === 'error'}
          aria-describedby="coupon-status"
          className={cn(
            'w-full min-w-0 border bg-foam px-3.5 py-2.5 font-sans text-sm uppercase tracking-[0.08em] text-ink outline-none transition-colors placeholder:tracking-normal placeholder:text-muted/60 focus:bg-surface',
            status === 'error' ? 'border-accent' : 'border-ink/15 focus:border-accent',
          )}
        />
        <button
          type="button"
          onClick={() => void check(code)}
          disabled={disabled || status === 'checking' || !tidy(code)}
          className="flex shrink-0 items-center justify-center gap-1.5 border border-base px-4 font-sans text-sm font-bold text-base transition-colors hover:bg-base hover:text-surface disabled:cursor-not-allowed disabled:opacity-40"
        >
          {status === 'checking' && <Loader2 size={14} className="animate-spin" />}
          {status === 'checking' ? 'Checking' : 'Apply'}
        </button>
      </div>
      {/* Polite, not assertive: this is the result of something they asked for, not an
          interruption — and it must be announced, because for a screen reader the only other
          evidence a code worked is a number changing further up the page. */}
      {/* Always in the DOM, even empty: a live region has to exist before it changes, or
          the first message is never announced. The margin is what is conditional. */}
      <p
        id="coupon-status"
        aria-live="polite"
        className={cn('text-xs font-medium text-accent', message && 'mt-1.5')}
      >
        {message}
      </p>
    </div>
  )
}
