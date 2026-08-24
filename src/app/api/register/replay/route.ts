/**
 * GET|POST /api/register/replay — push any lead the Sheet never accepted.
 *
 * The counterpart to /api/payment/reconcile, and deliberately a separate endpoint rather
 * than a flag on it: reconcile refuses to run when payments are disabled, and disabled
 * payments is exactly when waitlist leads are the only submissions there are. Folding
 * this into it would have made the recovery path unavailable in the one state that needs
 * it most.
 *
 * Safe to run as often as you like. It only ever re-sends leads still marked unsynced,
 * and a lead that syncs is marked so it is never sent again.
 *
 * Hourly from cron, alongside the payment sweep:
 *   curl -fsS "https://tier2rising.com/api/register/replay?secret=…"
 */

import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { appendToSheet } from '@/lib/submission'
import { sheetRow } from '@/lib/registration-input'
import { unsyncedLeads, markSynced, markFailed, leadsHealth, leadStats } from '@/lib/leads'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** One batch, so a long backlog cannot hold the request open past a proxy timeout. */
const MAX_PER_RUN = 25

/**
 * Shares PAYMENT_RECONCILE_SECRET rather than introducing a second one.
 *
 * Both endpoints are the same kind of thing — an ops recovery hook, called by cron, that
 * reads customer data — so they are the same trust boundary. A second secret would be a
 * second thing to rotate and a second thing to leave unset, and unset means the endpoint
 * is dead exactly when it is needed.
 */
function authorised(req: Request): boolean {
  const expected = (process.env.PAYMENT_RECONCILE_SECRET || '').trim()
  // No secret means no endpoint. This lists customer data; it must never default to open.
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
    // 404, not 401: an unauthenticated caller should not learn that this exists.
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
  }

  const health = leadsHealth()
  if (!health.healthy) {
    return NextResponse.json(
      { ok: false, error: `lead log unreadable at ${health.path}: ${health.error}` },
      { status: 500 },
    )
  }

  const pending = unsyncedLeads()
  const batch = pending.slice(0, MAX_PER_RUN)
  const results: { id: string; ok: boolean; error?: string }[] = []

  // Sequential on purpose. Apps Script serialises on a script lock anyway, so firing 25
  // at once would just queue them behind each other while burning 25 concurrent sockets.
  for (const lead of batch) {
    const res = await appendToSheet(
      'registration',
      sheetRow(lead.registration, { paymentStatus: 'Waitlist' }),
    )
    if (res.ok) {
      markSynced(lead.id)
      results.push({ id: lead.id, ok: true })
    } else {
      markFailed(lead.id, res.error, (lead.syncAttempts || 0) + 1)
      results.push({ id: lead.id, ok: false, error: res.error })
    }
  }

  const synced = results.filter((r) => r.ok).length
  return NextResponse.json({
    ok: true,
    pending: pending.length,
    attempted: batch.length,
    synced,
    failed: results.length - synced,
    remaining: Math.max(pending.length - synced, 0),
    results,
    stats: leadStats(),
  })
}

export const GET = run
export const POST = run
