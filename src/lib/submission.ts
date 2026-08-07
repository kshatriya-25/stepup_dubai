/**
 * Shared plumbing for the public form endpoints (/api/register, /api/partner).
 *
 * Both are unauthenticated, both trigger outbound mail, and both write to the same
 * Apps Script Web App — so validation, throttling and the sheet write live here once
 * rather than being copy-pasted and drifting apart.
 */

import 'server-only'

export const SHEET_ENDPOINT = process.env.NEXT_PUBLIC_REGISTRATION_ENDPOINT || ''

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Trim, cap length, and coerce anything non-string to ''. */
export function clean(value: unknown, max = 200): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

/**
 * Force every phone number into one shape: `+91 98765 43210`.
 *
 * The forms already constrain input, but these endpoints are public — a direct POST
 * can send anything. Normalising server-side rather than trusting the client is what
 * actually guarantees the sheet and the emails hold a single format.
 *
 * Tolerates the common variants on the way in (+91…, 0091…, 091…, spaced, hyphenated)
 * and rejects anything that isn't an Indian 10-digit mobile.
 */
export function normalisePhone(raw: string): string | null {
  // Leading zeros are always trunk/international prefixes here — no Indian mobile
  // starts with one — so stripping them collapses 0…, 00…, 0091… in one step.
  let d = raw.replace(/\D/g, '').replace(/^0+/, '')
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2)
  if (!/^[6-9]\d{9}$/.test(d)) return null
  return `+91 ${d.slice(0, 5)} ${d.slice(5)}`
}

/* -- Rate limit ----------------------------------------------------------- *
 * These endpoints are public and trigger outbound mail, so an unthrottled bot could
 * burn the Brevo quota and the sending reputation with it. In-memory is enough for a
 * single-process deployment; swap for Redis only if you scale out.
 *
 * The budget is shared across both forms, keyed by IP, which is what we want — the
 * limit exists to cap outbound mail per visitor, not per endpoint. */
const WINDOW_MS = 60 * 60 * 1000
// Raised from 5 to 50 while the site is being tested — repeated submissions from one
// office IP were the limit's most likely victim. Drop it back to ~5 before launch:
// at 50/hour a single IP can burn a third of the Brevo free-tier daily quota.
const MAX_PER_WINDOW = 50
const hits = new Map<string, number[]>()

export function rateLimited(ip: string): boolean {
  const now = Date.now()
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS)
  recent.push(now)
  hits.set(ip, recent)
  if (hits.size > 5000) hits.clear() // crude bound; this map must never grow forever
  return recent.length > MAX_PER_WINDOW
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  return (fwd ? fwd.split(',')[0] : req.headers.get('x-real-ip'))?.trim() || 'unknown'
}

/**
 * Append a row via the existing Apps Script Web App.
 *
 * `type` selects the destination tab in the script ('registration' | 'partner'), so
 * both forms share one deployment and one URL.
 *
 * Runs server-side, so unlike the old browser-side call there is no CORS constraint
 * and we can read the response instead of firing blind. Apps Script answers the /exec
 * URL with a 302 to googleusercontent.com; fetch follows it and the JSON arrives from
 * there.
 */
export async function appendToSheet(
  type: 'registration' | 'partner',
  fields: Record<string, string>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!SHEET_ENDPOINT) return { ok: false, error: 'NEXT_PUBLIC_REGISTRATION_ENDPOINT is not set' }
  try {
    const res = await fetch(SHEET_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ ...fields, type }),
      signal: AbortSignal.timeout(15000),
      cache: 'no-store',
    })
    if (!res.ok) return { ok: false, error: `Apps Script returned ${res.status}` }
    const text = await res.text()
    // A successful script returns {"ok":true}. An HTML body means the deployment is
    // not public ("Who has access: Anyone") and Google served a sign-in page instead.
    if (text.includes('"ok":true')) return { ok: true }
    return { ok: false, error: `Unexpected Apps Script response: ${text.slice(0, 200)}` }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}
