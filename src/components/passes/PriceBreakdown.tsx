'use client'

import { cn } from '@/lib/cn'
import { formatPaise, type Line, type OrderTotal } from '@/lib/order-total'

/**
 * THE PRICE, SPELLED OUT. One renderer, two places: the summary rail on the navy panel and
 * the review step on the form.
 *
 * Both have to show the same arithmetic, and before this they each wrote their own version
 * of it — which was survivable while the only line was "pass + extras" and stopped being
 * survivable the moment an early-bird credit and a coupon joined it. The lines come from
 * orderTotal() in @/lib/order-total, which is also what /api/payment/order charges from, so
 * what the reader adds up on the page is what the card is debited for.
 *
 * WHY THE CREDITS ARE LINES RATHER THAN A STRUCK-THROUGH PRICE
 * A strikethrough says "it used to be more". It does not say by how much, it cannot show
 * two reductions at once, and a coupon landing on top of an early bird turns it into a
 * puzzle. Written out, the discount is a number in the same column as everything else, the
 * reader can check it, and "You save ₹600" at the bottom is a claim they have just verified
 * rather than one they are being asked to take.
 *
 * `tone` exists because the same table sits on #072B5F in the rail and on the pale `foam`
 * in the review step. It is a colour map and nothing else — the row structure, the order of
 * the lines and the wording are identical, because they are the same statement about money.
 */

type Tone = 'dark' | 'light'

const T: Record<
  Tone,
  { label: string; note: string; amount: string; credit: string; rule: string; total: string; save: string }
> = {
  dark: {
    label: 'text-surface/85',
    note: 'text-surface/55',
    amount: 'text-surface/85',
    credit: 'text-accent',
    rule: 'border-surface/20',
    total: 'text-surface',
    save: 'text-accent',
  },
  light: {
    label: 'text-muted',
    note: 'text-muted/70',
    amount: 'text-muted',
    credit: 'text-accent',
    rule: 'border-ink/15',
    total: 'text-ink',
    save: 'text-accent',
  },
}

function Row({
  tone,
  label,
  note,
  paise,
  credit,
  strong,
}: {
  tone: Tone
  label: string
  note?: string
  paise: number
  credit?: boolean
  strong?: boolean
}) {
  const t = T[tone]
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className={cn('min-w-0', strong ? cn('font-sans font-semibold', t.total) : t.label)}>
        {label}
        {note && <span className={cn('block text-[11px] leading-tight', t.note)}>{note}</span>}
      </span>
      <span
        className={cn(
          'shrink-0 tabular-nums',
          credit ? cn('font-medium', t.credit) : strong ? cn('font-sans font-semibold', t.total) : t.amount,
        )}
      >
        {credit ? '−' : ''}
        {formatPaise(paise)}
      </span>
    </div>
  )
}

function lineRow(tone: Tone, line: Line) {
  return (
    <Row
      key={line.key}
      tone={tone}
      label={line.label}
      note={line.note}
      paise={line.paise}
      credit={line.kind === 'credit'}
    />
  )
}

export function PriceBreakdown({
  total,
  tone,
  totalLabel = 'Total payable',
  className,
}: {
  total: OrderTotal
  tone: Tone
  /** "Total payable" in the rail, "Total" in the review step's narrower column. */
  totalLabel?: string
  className?: string
}) {
  const t = T[tone]
  /*
   * Everything the reader is not paying, added up — the early bird and the coupon together.
   * Taken from the lines rather than recomputed, so a credit added to orderTotal() later is
   * counted here without anyone remembering to come back.
   */
  const savedPaise =
    total.items.filter((l) => l.kind === 'credit').reduce((n, l) => n + l.paise, 0) + total.discountPaise
  const savedFrom = [
    ...total.items.filter((l) => l.kind === 'credit').map((l) => l.label),
    total.coupon?.note,
  ].filter(Boolean)

  return (
    <div className={className}>
      <div className="flex flex-col gap-2">
        {total.items.map((line) => lineRow(tone, line))}

        {/* The subtotal only earns a row when a coupon has to be taken OFF something. */}
        {total.coupon && (
          <>
            <div className={cn('mt-0.5 border-t border-dashed pt-2', t.rule)}>
              <Row tone={tone} label="Subtotal" paise={total.subtotalPaise} />
            </div>
            {lineRow(tone, total.coupon)}
          </>
        )}
      </div>

      <div className={cn('mt-3 flex items-baseline justify-between gap-3 border-t pt-3', t.rule)}>
        <span className={cn('font-sans text-sm font-semibold', t.total)}>{totalLabel}</span>
        <span className={cn('font-sans text-2xl font-bold leading-none tabular-nums', t.total)}>
          {formatPaise(total.totalPaise)}
        </span>
      </div>

      {savedPaise > 0 && (
        <p className={cn('mt-1.5 text-right font-sans text-[11px] font-semibold leading-tight', t.save)}>
          You save {formatPaise(savedPaise)}
          {savedFrom.length > 0 && (
            <span className={cn('font-normal', t.note)}> · {savedFrom.join(' + ')}</span>
          )}
        </p>
      )}
    </div>
  )
}
