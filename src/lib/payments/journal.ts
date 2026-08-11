/**
 * The payment journal — a crash-safe, append-only record of every order we create and
 * what happened to it.
 *
 * WHY THIS EXISTS
 * A payment and a registration live in two different systems (Razorpay, and the Google
 * Sheet + Brevo). Any moment between "money captured" and "registration recorded" is a
 * window where a crash, a deploy, a killed pm2 process or a dropped connection loses
 * the registration while keeping the customer's money. That is the one failure this
 * whole subsystem exists to prevent.
 *
 * The journal closes that window by writing intent to disk BEFORE money moves, and by
 * making fulfilment idempotent so it can be safely retried by anyone — the browser,
 * the webhook, or the reconciliation sweep — without double-charging, double-mailing
 * or double-recording.
 *
 * DESIGN
 * Append-only JSONL, last-write-wins per orderId, index rebuilt on boot. Append-only
 * is the point: an interrupted write can corrupt at most the final line, and a
 * corrupt final line is discarded on load without touching the history behind it. An
 * in-place mutation could lose everything.
 *
 * SCOPE — READ THIS BEFORE SCALING OUT
 * Correct for ONE Node process (pm2 fork mode, which is how this deploys). Under pm2
 * cluster mode or several servers, two workers would keep divergent in-memory indexes
 * and the idempotency guarantee breaks. If you ever scale out, move this to Redis or
 * Postgres — the interface is small on purpose. See PAYMENTS.md.
 *
 * Even so, the journal is only ever the FAST path. Razorpay holds the same
 * registration payload in the order's `notes`, so a lost disk degrades reconciliation
 * from instant to a sweep — never to data loss.
 */

import 'server-only'
import { existsSync, mkdirSync, readFileSync, appendFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

export type PaymentStatus =
  /** Order created, customer has not paid (or we do not know yet). No money moved. */
  | 'pending'
  /** Razorpay confirmed money captured. MUST end up fulfilled or alerted — never dropped. */
  | 'paid'
  /** Money captured AND registration recorded AND confirmation sent. Terminal, happy. */
  | 'fulfilled'
  /** Money captured but recording failed after retries. Terminal, ALERTED, needs a human. */
  | 'fulfil_failed'
  /** Razorpay reported the payment attempt failed. No money moved. Terminal, harmless. */
  | 'failed'

export type Registration = {
  name: string
  email: string
  phone: string
  sector: string
  registerAs: string
  city: string
  updates: string
}

export type PaymentRecord = {
  orderId: string
  receipt: string
  amountPaise: number
  status: PaymentStatus
  registration: Registration
  paymentId?: string
  method?: string
  /**
   * Deduplication key for order creation, derived from payer + amount + time bucket.
   * Razorpay's own idempotency header does not cover the Orders API, so reuse is
   * decided here instead — see findByIdempotencyKey().
   */
  idempotencyKey?: string
  /** When Razorpay captured the money. Set the first time capture is confirmed. */
  paidAt?: string
  /** Set once the sheet row and participant email are both done. */
  fulfilledAt?: string
  /** How many times fulfilment has been attempted; drives the alert threshold. */
  fulfilAttempts: number
  lastError?: string
  /** True once the paid-but-unfulfilled alert has gone out, so we alert once, not hourly. */
  alerted?: boolean
  createdAt: string
  updatedAt: string
}

const JOURNAL_PATH =
  process.env.PAYMENT_JOURNAL_PATH || join(process.cwd(), 'data', 'payments.jsonl')

/** Rewrite the file when it exceeds this many lines, collapsing superseded versions. */
const COMPACT_AT_LINES = 5000

let index: Map<string, PaymentRecord> | null = null
let lineCount = 0

function load(): Map<string, PaymentRecord> {
  if (index) return index
  const map = new Map<string, PaymentRecord>()
  lineCount = 0

  try {
    if (existsSync(JOURNAL_PATH)) {
      const lines = readFileSync(JOURNAL_PATH, 'utf8').split('\n')
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue
        try {
          const rec = JSON.parse(trimmed) as PaymentRecord
          if (rec && typeof rec.orderId === 'string') {
            map.set(rec.orderId, rec)
            lineCount++
          }
        } catch {
          // A half-written final line is the expected shape of a crash. Skipping it
          // costs at most the newest state transition, which reconciliation restores
          // from Razorpay. Do NOT abort the load — that would hide every good record
          // behind one bad byte.
          console.warn('[payments] skipping unparseable journal line')
        }
      }
    }
  } catch (err) {
    // Never let journal trouble take the site down; log loudly and start empty.
    // Reconciliation against Razorpay is the recovery path.
    console.error('[payments] could not read journal:', err)
  }

  index = map
  return map
}

function persist(rec: PaymentRecord): void {
  const dir = dirname(JOURNAL_PATH)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  appendFileSync(JOURNAL_PATH, `${JSON.stringify(rec)}\n`, 'utf8')
  lineCount++
  if (lineCount > COMPACT_AT_LINES) compact()
}

/**
 * Collapse superseded versions. Writes a temp file and renames over the original —
 * rename() is atomic on POSIX, so a crash mid-compaction leaves the old journal fully
 * intact rather than a truncated new one.
 */
function compact(): void {
  try {
    const map = load()
    const tmp = `${JOURNAL_PATH}.tmp`
    const body = [...map.values()].map((r) => JSON.stringify(r)).join('\n')
    writeFileSync(tmp, body ? `${body}\n` : '', 'utf8')
    renameSync(tmp, JOURNAL_PATH)
    lineCount = map.size
  } catch (err) {
    console.error('[payments] compaction failed (harmless, will retry):', err)
  }
}

/* -- Mutex ------------------------------------------------------------------
 * Node is single-threaded but `await` yields, so two concurrent requests for the same
 * order — the classic case being the browser's verify and Razorpay's webhook landing
 * within milliseconds of each other — can interleave a read-modify-write and both
 * decide "not fulfilled yet". That is a double email and a duplicate sheet row.
 *
 * A per-key promise chain serialises them so the second one observes the first one's
 * result. Keyed per order, so unrelated payments never wait on each other. */
const chains = new Map<string, Promise<unknown>>()

export function withOrderLock<T>(orderId: string, fn: () => Promise<T>): Promise<T> {
  const prior = chains.get(orderId) ?? Promise.resolve()
  const next = prior.then(fn, fn)
  // Always clear the tail, success or failure, or a rejected chain would wedge the key.
  chains.set(
    orderId,
    next.catch(() => undefined),
  )
  void next.catch(() => undefined).finally(() => {
    if (chains.get(orderId) === undefined) chains.delete(orderId)
  })
  return next
}

/* -- Public API ------------------------------------------------------------- */

export function getRecord(orderId: string): PaymentRecord | undefined {
  return load().get(orderId)
}

export function findByPaymentId(paymentId: string): PaymentRecord | undefined {
  for (const rec of load().values()) if (rec.paymentId === paymentId) return rec
  return undefined
}

/**
 * An UNPAID order already created for this exact key, if any.
 *
 * Only 'pending' records qualify. Handing back an order that has already been paid
 * would let a second customer — or the same one on a legitimate second purchase —
 * attach to a consumed order, so anything past 'pending' forces a fresh one.
 */
export function findReusableByIdempotencyKey(key: string): PaymentRecord | undefined {
  for (const rec of load().values()) {
    if (rec.idempotencyKey === key && rec.status === 'pending') return rec
  }
  return undefined
}

export function createRecord(args: {
  orderId: string
  receipt: string
  amountPaise: number
  registration: Registration
  idempotencyKey?: string
}): PaymentRecord {
  const now = new Date().toISOString()
  const rec: PaymentRecord = {
    ...args,
    status: 'pending',
    fulfilAttempts: 0,
    createdAt: now,
    updatedAt: now,
  }
  load().set(rec.orderId, rec)
  persist(rec)
  return rec
}

/**
 * Apply a patch and write it. Returns the new record.
 *
 * Call this INSIDE withOrderLock() whenever the decision to update depended on
 * reading the record first.
 */
export function updateRecord(
  orderId: string,
  patch: Partial<Omit<PaymentRecord, 'orderId' | 'createdAt'>>,
): PaymentRecord | undefined {
  const map = load()
  const current = map.get(orderId)
  if (!current) return undefined
  const next: PaymentRecord = { ...current, ...patch, updatedAt: new Date().toISOString() }
  map.set(orderId, next)
  persist(next)
  return next
}

/**
 * Adopt an order that Razorpay knows about but this journal does not — a disk loss, a
 * restore from an older backup, or a payment made against a previous deploy. The
 * registration payload is reconstructed from the order's `notes`.
 */
export function adoptRecord(args: {
  orderId: string
  receipt: string
  amountPaise: number
  registration: Registration
  status: PaymentStatus
  paymentId?: string
}): PaymentRecord {
  const now = new Date().toISOString()
  const rec: PaymentRecord = {
    orderId: args.orderId,
    receipt: args.receipt,
    amountPaise: args.amountPaise,
    registration: args.registration,
    status: args.status,
    paymentId: args.paymentId,
    fulfilAttempts: 0,
    createdAt: now,
    updatedAt: now,
  }
  load().set(rec.orderId, rec)
  persist(rec)
  return rec
}

/** Paid but not yet recorded — the set that must always drain to empty. */
export function outstanding(): PaymentRecord[] {
  return [...load().values()].filter((r) => r.status === 'paid' || r.status === 'fulfil_failed')
}

export function stats(): Record<PaymentStatus | 'total', number> {
  const out = {
    pending: 0,
    paid: 0,
    fulfilled: 0,
    fulfil_failed: 0,
    failed: 0,
    total: 0,
  }
  for (const r of load().values()) {
    out[r.status]++
    out.total++
  }
  return out
}

export const journalPath = JOURNAL_PATH
