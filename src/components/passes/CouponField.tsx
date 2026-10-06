'use client'

import { Check, Loader2, Plus, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatPaise, type AppliedDiscount } from '@/lib/order-total'

/**
 * The coupon box — CLOSED until somebody says they have a code.
 *
 * WHY IT IS A DISCLOSURE AND NOT AN OPEN FIELD
 * It was an open field, and an open field is an unanswered question: a reader who has no
 * code is told, at the last screen before paying, that other people are paying less. That
 * sends them off to search for one and a good number of them do not come back. Shut, it
 * costs the people who have a code one tap and costs everybody else nothing — the only
 * ones who open it are the ones who already know they have something to type.
 *
 * IT LIVES IN THE ORDER SUMMARY, beside the number it changes. The form is where you say
 * who you are; the summary is where the money is, and a discount is a fact about the money.
 *
 * PRESENTATIONAL ONLY. It holds no state and talks to no endpoint. PassFlow owns the typed
 * code, the applied discount, the request and its status, because this component is
 * rendered TWICE — once in the rail for desktop, once inside the form's money panel for
 * phones, where the rail sits below the Pay button — and two copies with their own state
 * would be two coupons.
 *
 * The code itself is checked by /api/payment/coupon and then again by /api/payment/order
 * at the moment money moves. Nothing here decides what a code is worth; see @/lib/coupons.
 */

type Tone = 'dark' | 'light'
type Status = 'idle' | 'checking' | 'error'

/**
 * Uppercase, letters and digits — the browser-side twin of normaliseCode() in
 * @/lib/coupons. Duplicated rather than imported because that module is server-only; the
 * server normalises again anyway, so this one is for the typing experience, not for truth.
 */
export const tidyCouponCode = (raw: string): string =>
  raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 24)

const T: Record<
  Tone,
  { trigger: string; label: string; input: string; apply: string; tick: string; muted: string; panel: string }
> = {
  dark: {
    trigger: 'text-accent hover:text-surface',
    label: 'text-surface',
    input: 'border-surface/25 bg-surface/95 text-ink placeholder:text-muted/60 focus:border-accent',
    apply: 'bg-accent text-accent-ink hover:bg-surface hover:text-base',
    tick: 'text-accent',
    muted: 'text-surface/60',
    panel: 'border-surface/20',
  },
  light: {
    trigger: 'text-accent hover:text-ink',
    label: 'text-ink',
    input: 'border-ink/15 bg-surface text-ink placeholder:text-muted/60 focus:border-accent',
    apply: 'border border-base text-base hover:bg-base hover:text-surface',
    tick: 'text-green',
    muted: 'text-muted',
    panel: 'border-ink/10',
  },
}

export function CouponField({
  tone,
  open,
  onOpenChange,
  code,
  onCodeChange,
  applied,
  status,
  error,
  onApply,
  onClear,
  disabled,
}: {
  tone: Tone
  open: boolean
  onOpenChange: (next: boolean) => void
  code: string
  onCodeChange: (next: string) => void
  applied: AppliedDiscount | null
  status: Status
  error: string
  onApply: (code: string) => void
  onClear: () => void
  disabled?: boolean
}) {
  const t = T[tone]

  /* ---- applied ------------------------------------------------------------------- *
   * Deliberately one line. The breakdown directly above already names the coupon, says
   * what it is worth and takes it off the total — repeating all of that in a panel would
   * be the same fact told twice in the same glance. What is NOT above it is the way out,
   * so that is what this row is for. */
  if (applied) {
    return (
      <div className={cn('flex items-center justify-between gap-3 border-t pt-3', t.panel)}>
        <p className={cn('flex min-w-0 items-center gap-1.5 text-xs', t.muted)}>
          <Check size={13} strokeWidth={3} className={cn('shrink-0', t.tick)} />
          <span className={cn('truncate font-sans font-semibold', t.label)}>{applied.code}</span>
          <span className="shrink-0">applied</span>
        </p>
        <button
          type="button"
          onClick={onClear}
          disabled={disabled}
          className={cn(
            'flex shrink-0 items-center gap-1 font-sans text-xs font-semibold underline-offset-2 transition-colors hover:underline disabled:opacity-50',
            t.trigger,
          )}
        >
          <X size={12} /> Remove
        </button>
      </div>
    )
  }

  /* ---- shut ------------------------------------------------------------------------ */
  if (!open) {
    return (
      <div className={cn('border-t pt-3', t.panel)}>
        <button
          type="button"
          onClick={() => onOpenChange(true)}
          disabled={disabled}
          className={cn(
            'flex items-center gap-1.5 font-sans text-xs font-semibold underline-offset-2 transition-colors hover:underline disabled:opacity-50',
            t.trigger,
          )}
        >
          <Plus size={13} strokeWidth={3} /> Have a coupon code?
        </button>
      </div>
    )
  }

  /* ---- open ------------------------------------------------------------------------ */
  return (
    <div className={cn('border-t pt-3', t.panel)}>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={`coupon-${tone}`} className={cn('font-sans text-xs font-semibold', t.label)}>
          Coupon code
        </label>
        <button
          type="button"
          onClick={() => {
            onCodeChange('')
            onOpenChange(false)
          }}
          className={cn('font-sans text-xs transition-colors', t.muted, 'hover:underline')}
        >
          Cancel
        </button>
      </div>

      <div className="mt-2 flex gap-2">
        <input
          id={`coupon-${tone}`}
          value={code}
          onChange={(e) => onCodeChange(tidyCouponCode(e.target.value))}
          // Not inside a <form>, so Enter has nothing to submit — wired here because
          // typing a code and pressing Enter is what everyone does.
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              onApply(code)
            }
          }}
          disabled={disabled || status === 'checking'}
          autoFocus
          autoComplete="off"
          spellCheck={false}
          /*
           * NEVER PUT A LIVE CODE HERE. A placeholder ships in the client bundle and shows
           * on the screen of everyone who opens this box, so "e.g. SINGAM20" — which this
           * said first — is not an example, it is a 20% discount handed to every visitor
           * whether a partner gave them one or not. That is the whole reason the catalogue
           * is server-side; a placeholder would have walked it straight back out.
           */
          placeholder="Enter code"
          aria-invalid={status === 'error'}
          aria-describedby={`coupon-status-${tone}`}
          className={cn(
            'w-full min-w-0 border px-3 py-2 font-sans text-sm uppercase tracking-[0.08em] outline-none transition-colors placeholder:tracking-normal',
            t.input,
            status === 'error' && 'border-accent',
          )}
        />
        <button
          type="button"
          onClick={() => onApply(code)}
          disabled={disabled || status === 'checking' || !tidyCouponCode(code)}
          className={cn(
            'flex shrink-0 items-center justify-center gap-1.5 px-4 font-sans text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40',
            t.apply,
          )}
        >
          {status === 'checking' && <Loader2 size={14} className="animate-spin" />}
          {status === 'checking' ? 'Checking' : 'Apply'}
        </button>
      </div>

      {/* Always in the DOM, even empty: a live region has to exist before it changes, or
          the first message is never announced. The margin is what is conditional. */}
      <p
        id={`coupon-status-${tone}`}
        aria-live="polite"
        className={cn('text-xs font-medium text-accent', error && 'mt-1.5')}
      >
        {error}
      </p>
    </div>
  )
}
