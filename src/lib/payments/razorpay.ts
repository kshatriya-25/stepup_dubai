/**
 * Razorpay API client and money primitives.
 *
 * Deliberately raw `fetch` rather than the `razorpay` npm package: this file needs
 * hard timeouts on every call and a single, auditable place where money crosses the
 * wire. A thin wrapper hides both.
 *
 * THE THREE RULES OF THIS FILE — read before changing anything:
 *
 *   1. The AMOUNT IS NEVER READ FROM THE CLIENT. It comes from REGISTRATION_FEE_INR
 *      and nowhere else. A browser that POSTs `{amount: 1}` must be unable to buy a
 *      ticket for one paisa. Every function here that takes an amount takes it from
 *      the server's own config.
 *
 *   2. MONEY IS INTEGER PAISE, never rupees-as-float. `0.1 + 0.2 !== 0.3` in IEEE-754,
 *      and Razorpay's API is paise-denominated anyway. Rupees exist here only for
 *      display, produced at the very edge by formatInr().
 *
 *   3. A PAYMENT IS ONLY REAL IF RAZORPAY SAYS SO. Signatures prove a message came
 *      from Razorpay; they do not prove the money moved. Before fulfilling anything,
 *      fetchPayment() and check status and amount against what we expected.
 */

import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'

const API = 'https://api.razorpay.com/v1'
const TIMEOUT_MS = 20_000

/* -- Configuration --------------------------------------------------------- */

export const keyId = (process.env.RAZORPAY_KEY_ID || '').trim()
const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim()
export const webhookSecret = (process.env.RAZORPAY_WEBHOOK_SECRET || '').trim()

/**
 * Payment is opt-in and explicit.
 *
 * It would be friendlier to infer "payment is on if the keys are present", but that
 * fails open in the worst possible way: a deploy that loses its env file would
 * silently start giving tickets away for free, and nobody would notice until the
 * gate. With an explicit flag, a half-configured deploy fails LOUD (paymentConfig()
 * returns an error and the form refuses to take registrations) instead of failing
 * cheap.
 */
export const paymentEnabled = process.env.REGISTRATION_PAYMENT_ENABLED === '1'

export type ConfigResult =
  | { ok: true; enabled: false }
  | { ok: true; enabled: true; keyId: string; currency: 'INR' }
  | { ok: false; error: string }

/**
 * What the rest of the app asks before touching money. Returns an error rather than
 * throwing so callers can decide whether to 503 or degrade.
 *
 * There is no amount here any more. Prices are per-ticket and come from
 * @/content/tickets, which the server and the page both import — see the header of
 * that file for why the price is not an env var.
 */
export function paymentConfig(): ConfigResult {
  if (!paymentEnabled) return { ok: true, enabled: false }
  const missing: string[] = []
  if (!keyId) missing.push('RAZORPAY_KEY_ID')
  if (!keySecret) missing.push('RAZORPAY_KEY_SECRET')
  if (missing.length) {
    return { ok: false, error: `Payment is enabled but ${missing.join(' and ')} not set.` }
  }
  return { ok: true, enabled: true, keyId, currency: 'INR' }
}

/** `rzp_live_…` means real money. Used to label logs, alerts and the receipt. */
export function isLiveMode(): boolean {
  return keyId.startsWith('rzp_live')
}

/** 123450 → "₹1,234.50" (trailing ".00" dropped). Display only — never for maths. */
export function formatInr(paise: number): string {
  const rupees = paise / 100
  const s = rupees.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return s.endsWith('.00') ? s.slice(0, -3) : s
}

/* -- Signature verification ------------------------------------------------ */

/**
 * Constant-time compare of two hex digests.
 *
 * `a === b` on a signature leaks, through timing, how many leading bytes matched —
 * which is enough to forge one byte at a time given enough attempts. timingSafeEqual
 * throws on length mismatch, hence the guard.
 */
function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  try {
    return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'))
  } catch {
    return false
  }
}

function hmac(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex')
}

/**
 * Verify the signature Checkout hands back to the browser.
 *
 * Razorpay signs `order_id|payment_id` with the key secret. This proves the browser's
 * success callback really came from Razorpay and was not fabricated by a visitor with
 * DevTools open — but see rule 3: it does NOT prove the money was captured.
 */
export function verifyCheckoutSignature(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  if (!keySecret || !orderId || !paymentId || !signature) return false
  return safeEqualHex(hmac(`${orderId}|${paymentId}`, keySecret), signature)
}

/**
 * Verify a webhook. Signed with the WEBHOOK secret (a different secret from the API
 * key) over the EXACT raw request body — re-serialising parsed JSON changes the bytes
 * and the signature will never match. Callers must pass `await req.text()`.
 */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  if (!webhookSecret || !signature) return false
  return safeEqualHex(hmac(rawBody, webhookSecret), signature)
}

/* -- HTTP ------------------------------------------------------------------ */

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string; status?: number }

async function call<T>(
  path: string,
  init: { method: 'GET' | 'POST'; body?: unknown; idempotencyKey?: string } = { method: 'GET' },
): Promise<ApiResult<T>> {
  if (!keyId || !keySecret) return { ok: false, error: 'Razorpay keys are not configured' }

  const headers: Record<string, string> = {
    authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
    'content-type': 'application/json',
  }
  /*
   * Sent for the audit trail only — DO NOT RELY ON IT.
   *
   * Razorpay's idempotency header is a RazorpayX Payouts feature; the standard Orders
   * API ignores it. Verified against the live test API: two POSTs with an identical
   * key returned order_TOSdZMPDdGDEBR and order_TOSdZXOjq8tGie. Deduplication is
   * therefore enforced on our side, in the journal — see /api/payment/order.
   */
  if (init.idempotencyKey) headers['x-razorpay-idempotency'] = init.idempotencyKey

  try {
    const res = await fetch(`${API}${path}`, {
      method: init.method,
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: 'no-store',
    })
    const text = await res.text()
    let parsed: unknown = null
    try {
      parsed = JSON.parse(text)
    } catch {
      /* fall through to the raw-text error below */
    }
    if (!res.ok) {
      const desc =
        (parsed as { error?: { description?: string } } | null)?.error?.description ||
        text.slice(0, 300)
      return { ok: false, error: `Razorpay ${res.status}: ${desc}`, status: res.status }
    }
    return { ok: true, data: parsed as T }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    // A timeout here is ambiguous, not negative: the order may well have been created.
    // Callers must treat it as "unknown", never as "did not happen".
    return { ok: false, error: msg }
  }
}

/* -- Entities -------------------------------------------------------------- */

export type RazorpayOrder = {
  id: string
  amount: number
  amount_paid: number
  amount_due: number
  currency: string
  receipt: string | null
  status: 'created' | 'attempted' | 'paid'
  notes: Record<string, string>
  created_at: number
}

export type RazorpayPayment = {
  id: string
  order_id: string | null
  amount: number
  currency: string
  status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed'
  method: string | null
  email: string | null
  contact: string | null
  captured: boolean
  notes: Record<string, string>
  error_description?: string | null
  created_at: number
}

/**
 * Create an order.
 *
 * `notes` is doing real work here, not decoration: it carries the whole registration
 * payload into Razorpay's storage. If this server's disk dies between payment and
 * fulfilment, every paid registration is still fully reconstructible from Razorpay
 * alone. That is the backstop behind the local journal.
 *
 * Razorpay caps notes at 15 keys, 256 chars per value — our six fields fit with room
 * spare, and clean() has already capped each one well under 256.
 */
export function createOrder(args: {
  amountPaise: number
  receipt: string
  notes: Record<string, string>
  idempotencyKey: string
}): Promise<ApiResult<RazorpayOrder>> {
  return call<RazorpayOrder>('/orders', {
    method: 'POST',
    idempotencyKey: args.idempotencyKey,
    body: {
      amount: args.amountPaise,
      currency: 'INR',
      // Razorpay rejects receipts over 40 chars.
      receipt: args.receipt.slice(0, 40),
      notes: args.notes,
      payment_capture: 1,
    },
  })
}

export function fetchOrder(orderId: string): Promise<ApiResult<RazorpayOrder>> {
  return call<RazorpayOrder>(`/orders/${encodeURIComponent(orderId)}`)
}

export function fetchPayment(paymentId: string): Promise<ApiResult<RazorpayPayment>> {
  return call<RazorpayPayment>(`/payments/${encodeURIComponent(paymentId)}`)
}

/**
 * Capture an authorised payment.
 *
 * Orders are created with `payment_capture: 1` so this is normally automatic, but an
 * account configured for manual capture would otherwise leave money merely authorised
 * — and an uncaptured authorisation expires and silently reverses after a few days.
 * Capturing explicitly when we see `authorized` makes us safe under both settings.
 */
export function capturePayment(
  paymentId: string,
  amountPaise: number,
): Promise<ApiResult<RazorpayPayment>> {
  return call<RazorpayPayment>(`/payments/${encodeURIComponent(paymentId)}/capture`, {
    method: 'POST',
    body: { amount: amountPaise, currency: 'INR' },
  })
}

/**
 * List payments in a time window, used by the reconciliation sweep.
 * `from`/`to` are Unix seconds; Razorpay caps `count` at 100.
 */
export function listPayments(
  from: number,
  to: number,
  count = 100,
  skip = 0,
): Promise<ApiResult<{ entity: string; count: number; items: RazorpayPayment[] }>> {
  const q = new URLSearchParams({
    from: String(from),
    to: String(to),
    count: String(Math.min(count, 100)),
    skip: String(skip),
  })
  return call(`/payments?${q}`)
}
