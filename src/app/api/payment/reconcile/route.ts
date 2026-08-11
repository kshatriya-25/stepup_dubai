/**
 * GET|POST /api/payment/reconcile — the sweep of last resort.
 *
 * Every other path can fail: the browser closes before /verify, the webhook is
 * misconfigured or its retries expire, the server is down for a deploy during both.
 * This endpoint closes the loop by asking the only party that always knows — Razorpay
 * — "what did you capture?", and fulfilling anything we have not.
 *
 * It works from Razorpay's ledger rather than our own, so it recovers payments this
 * server has never heard of: a wiped journal, a restore from an old backup, or an
 * order created by a previous deploy. Those get adopted from the order's `notes`.
 *
 * Run it hourly from cron (see PAYMENTS.md):
 *   curl -fsS "https://tier2rising.com/api/payment/reconcile?secret=…&hours=6"
 *
 * Safe to run as often as you like — fulfilment is idempotent, so a sweep over
 * already-settled payments does nothing but read.
 */

import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { listPayments, paymentConfig, formatInr, isLiveMode } from '@/lib/payments/razorpay'
import { settle } from '@/lib/payments/fulfil'
import { getRecord, outstanding, stats } from '@/lib/payments/journal'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_HOURS = 24 * 30

function authorised(req: Request): boolean {
  const expected = (process.env.PAYMENT_RECONCILE_SECRET || '').trim()
  // No secret means no endpoint. Reconciliation lists customer payments, so it must
  // never default to open.
  if (!expected) return false
  const url = new URL(req.url)
  const given =
    url.searchParams.get('secret') || (req.headers.get('authorization') || '').replace(/^Bearer /, '')
  if (!given || given.length !== expected.length) return false
  try {
    return timingSafeEqual(Buffer.from(given), Buffer.from(expected))
  } catch {
    return false
  }
}

async function run(req: Request) {
  if (!authorised(req)) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
  }

  const cfg = paymentConfig()
  if (!cfg.ok || !cfg.enabled) {
    return NextResponse.json({ ok: false, error: 'Payment is not enabled.' }, { status: 503 })
  }

  const url = new URL(req.url)
  const hours = Math.min(Math.max(Number(url.searchParams.get('hours')) || 6, 1), MAX_HOURS)
  const now = Math.floor(Date.now() / 1000)
  const from = now - hours * 3600

  const checked: string[] = []
  const repaired: { orderId: string; paymentId: string; amount: string }[] = []
  const stillBroken: { orderId: string; paymentId: string; amount: string; reason: string }[] = []
  const errors: string[] = []

  // --- 1. Anything Razorpay captured in the window -------------------------
  let skip = 0
  let scanned = 0
  for (let page = 0; page < 20; page++) {
    const res = await listPayments(from, now, 100, skip)
    if (!res.ok) {
      errors.push(`listPayments(skip=${skip}): ${res.error}`)
      break
    }
    const items = res.data.items || []
    scanned += items.length

    for (const p of items) {
      if (p.status !== 'captured' || !p.order_id) continue
      checked.push(p.id)

      // Fast path: we already know this one is done. Skip without an API call.
      const known = getRecord(p.order_id)
      if (known?.status === 'fulfilled') continue

      const result = await settle({
        orderId: p.order_id,
        paymentId: p.id,
        payment: p,
        source: 'reconcile',
      })
      const amount = formatInr(p.amount)
      if (result.status === 'fulfilled' && !result.alreadyDone) {
        console.warn(`[payments] reconcile RECOVERED order=${p.order_id} payment=${p.id} ${amount}`)
        repaired.push({ orderId: p.order_id, paymentId: p.id, amount })
      } else if (result.status === 'fulfil_failed') {
        stillBroken.push({ orderId: p.order_id, paymentId: p.id, amount, reason: result.error })
      } else if (result.status === 'unknown') {
        stillBroken.push({ orderId: p.order_id, paymentId: p.id, amount, reason: result.reason })
      }
    }

    if (items.length < 100) break
    skip += 100
  }

  // --- 2. Anything our own journal still shows as owed ---------------------
  // Catches payments captured OUTSIDE the scanned window that never settled — a
  // wide sweep would find them, but this makes the debt visible on every run.
  for (const rec of outstanding()) {
    if (checked.includes(rec.paymentId || '')) continue
    if (!rec.paymentId) continue
    const result = await settle({ orderId: rec.orderId, paymentId: rec.paymentId, source: 'reconcile' })
    const amount = formatInr(rec.amountPaise)
    if (result.status === 'fulfilled' && !result.alreadyDone) {
      repaired.push({ orderId: rec.orderId, paymentId: rec.paymentId, amount })
    } else if (result.status !== 'fulfilled') {
      stillBroken.push({
        orderId: rec.orderId,
        paymentId: rec.paymentId,
        amount,
        reason: 'error' in result ? result.error : result.reason,
      })
    }
  }

  const body = {
    ok: errors.length === 0,
    mode: isLiveMode() ? 'LIVE' : 'test',
    windowHours: hours,
    scanned,
    capturedChecked: checked.length,
    repaired,
    stillBroken,
    errors,
    journal: stats(),
  }

  // Non-2xx when money is still owed, so a cron wrapper using `curl -f` fails loudly
  // and whatever watches cron raises it. Silent reconciliation is not reconciliation.
  const healthy = errors.length === 0 && stillBroken.length === 0
  return NextResponse.json(body, { status: healthy ? 200 : 500 })
}

export const GET = run
export const POST = run
