/**
 * Append-only log of every non-paid submission — free passes and waitlist entries.
 *
 * WHY THIS EXISTS: THE SHEET WAS THE ONLY COPY.
 *
 * A paid registration is stored four times before anyone calls it done — the payment
 * journal on disk, Razorpay's own order notes, the Google Sheet, and the receipt in the
 * customer's inbox. Any one of them can be lost and the registration is still
 * recoverable. That redundancy is the whole point of payments/journal.ts.
 *
 * A waitlist entry had exactly one: the Sheet. If Apps Script was slow, mid-redeploy, or
 * serving a version without the right columns, /api/register returned 502 and the lead
 * was gone — the visitor had typed a pitch into a form and we kept nothing at all. And
 * these are the submissions that matter most while the till is closed, because they are
 * the only ones there are.
 *
 * So the order is inverted. This file is written FIRST and is the record of truth; the
 * Sheet becomes a projection of it. A sheet write that fails no longer fails the
 * submission — it leaves a row flagged unsynced for replay(). The visitor is told they
 * are on the list, because they are.
 *
 * APPEND-ONLY, and updates are appended too rather than rewriting the file. A crash
 * halfway through rewriting a JSONL is how you lose the lines you were not editing;
 * appending can only ever lose the line being written. Reads fold by id, last write
 * wins, so a torn final line is discarded by the JSON.parse guard and the previous
 * state of that lead survives.
 */

import 'server-only'
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import type { Registration } from '@/lib/payments/journal'

/**
 * Sits beside the payment journal, so ops configures ONE path and both land together.
 * A separate env var would be a second thing to get wrong on a new box, and the failure
 * would be silent until someone went looking for a lead that was never written.
 */
const LEADS_PATH = (() => {
  const paymentPath = process.env.PAYMENT_JOURNAL_PATH
  if (paymentPath) return join(dirname(paymentPath), 'leads.jsonl')
  return join(process.cwd(), 'data', 'leads.jsonl')
})()

export type Lead = {
  id: string
  at: string
  registration: Registration
  /** False until the Google Sheet has accepted the row. */
  sheetSynced: boolean
  /** Last sheet error, kept so a persistent failure is diagnosable without the logs. */
  lastError?: string
  syncAttempts: number
}

type Line = { id: string } & Partial<Lead>

function ensureDir(): void {
  const dir = dirname(LEADS_PATH)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

export function leadsHealth(): { healthy: boolean; path: string; error?: string } {
  try {
    ensureDir()
    // Touch rather than assume: a directory can exist and still be unwritable by the
    // pm2 user, which is the failure this is actually guarding against.
    if (!existsSync(LEADS_PATH)) writeFileSync(LEADS_PATH, '', { flag: 'a' })
    appendFileSync(LEADS_PATH, '')
    return { healthy: true, path: LEADS_PATH }
  } catch (err) {
    return { healthy: false, path: LEADS_PATH, error: err instanceof Error ? err.message : String(err) }
  }
}

function readLines(): Line[] {
  try {
    return readFileSync(LEADS_PATH, 'utf8')
      .split('\n')
      .filter((l) => l.trim())
      .map((l) => {
        try {
          return JSON.parse(l) as Line
        } catch {
          // A torn final line from a crash mid-append. Skipping it is exactly right —
          // the previous state of that lead is an earlier, complete line.
          return null
        }
      })
      .filter((x): x is Line => !!x && typeof x.id === 'string')
  } catch {
    return []
  }
}

/** Fold the append-only log into current state, last write per id winning. */
function fold(): Map<string, Lead> {
  const out = new Map<string, Lead>()
  for (const line of readLines()) {
    const prev = out.get(line.id)
    out.set(line.id, { ...(prev ?? ({} as Lead)), ...line } as Lead)
  }
  return out
}

function append(line: Line): void {
  ensureDir()
  appendFileSync(LEADS_PATH, JSON.stringify(line) + '\n', 'utf8')
}

/**
 * Record the submission. Throws if it cannot — the caller must treat that as a real
 * failure, because at that point nothing anywhere has the visitor's details.
 */
export function recordLead(registration: Registration): Lead {
  const lead: Lead = {
    id: randomUUID(),
    at: new Date().toISOString(),
    registration,
    sheetSynced: false,
    syncAttempts: 0,
  }
  append(lead)
  return lead
}

export function markSynced(id: string): void {
  try {
    append({ id, sheetSynced: true, lastError: undefined })
  } catch {
    // The sheet has the row; only our note about it failed. Replay would re-send it,
    // and the Apps Script dedupes on Order ID — but a waitlist row has no order id, so
    // log loudly rather than risk a silent duplicate.
    console.error(`[leads] could not mark ${id} synced — replay may re-send it`)
  }
}

export function markFailed(id: string, error: string, attempts: number): void {
  try {
    append({ id, sheetSynced: false, lastError: error, syncAttempts: attempts })
  } catch {
    console.error(`[leads] could not record sync failure for ${id}: ${error}`)
  }
}

/** Leads the Sheet has never accepted, oldest first. */
export function unsyncedLeads(): Lead[] {
  return [...fold().values()]
    .filter((l) => !l.sheetSynced)
    .sort((a, b) => a.at.localeCompare(b.at))
}

export function leadStats(): { total: number; synced: number; unsynced: number } {
  const all = [...fold().values()]
  const synced = all.filter((l) => l.sheetSynced).length
  return { total: all.length, synced, unsynced: all.length - synced }
}
