/**
 * POST /api/register — the one place a registration is handled.
 *
 * Does three things, in this order of importance:
 *   1. Appends the row to the Google Sheet (the record of truth — must not be lost).
 *   2. Emails the participant a confirmation.
 *   3. Emails the organiser a notification.
 *
 * Step 1 failing is an error the visitor sees. Steps 2 and 3 failing are logged but
 * still return ok — a captured lead with no confirmation email beats a visitor who
 * gets told "something went wrong" and never registers again.
 *
 * This route is why next.config.mjs no longer sets `output: 'export'`; see HOSTING.md.
 */

import { NextResponse } from 'next/server'
import { sendMail, organiserRecipients, mailConfigured } from '@/lib/email/mailer'
import { participantEmail, organiserEmail, type Registration } from '@/lib/email/templates'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SHEET_ENDPOINT = process.env.NEXT_PUBLIC_REGISTRATION_ENDPOINT || ''

/* -- Rate limit ----------------------------------------------------------- *
 * The endpoint is public and now triggers outbound mail, so an unthrottled bot
 * could burn the Brevo quota and the sending reputation with it. In-memory is
 * enough for a single-process deployment; swap for Redis only if you scale out. */
const WINDOW_MS = 60 * 60 * 1000
// Raised from 5 to 50 while the site is being tested — repeated submissions from one
// office IP were the limit's most likely victim. Drop it back to ~5 before launch:
// at 50/hour a single IP can burn a third of the Brevo free-tier daily quota.
const MAX_PER_WINDOW = 50
const hits = new Map<string, number[]>()

function rateLimited(ip: string): boolean {
  const now = Date.now()
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS)
  recent.push(now)
  hits.set(ip, recent)
  if (hits.size > 5000) hits.clear() // crude bound; this map must never grow forever
  return recent.length > MAX_PER_WINDOW
}

function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  return (fwd ? fwd.split(',')[0] : req.headers.get('x-real-ip'))?.trim() || 'unknown'
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function clean(value: unknown, max = 200): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

/**
 * Force every phone number into one shape: `+91 98765 43210`.
 *
 * The form already constrains input, but this endpoint is public — a direct POST can
 * send anything. Normalising here rather than trusting the client is what actually
 * guarantees the sheet and the emails hold a single format.
 *
 * Tolerates the common variants on the way in (+91…, 0091…, 091…, spaced, hyphenated)
 * and rejects anything that isn't an Indian 10-digit mobile.
 */
function normalisePhone(raw: string): string | null {
  // Leading zeros are always trunk/international prefixes here — no Indian mobile
  // starts with one — so stripping them collapses 0…, 00…, 0091… in one step.
  let d = raw.replace(/\D/g, '').replace(/^0+/, '')
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2)
  if (!/^[6-9]\d{9}$/.test(d)) return null
  return `+91 ${d.slice(0, 5)} ${d.slice(5)}`
}

export async function POST(req: Request) {
  let raw: Record<string, unknown>
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body.' }, { status: 400 })
  }

  // NOTE: there was a hidden honeypot field here. It was removed, not fixed.
  // Browser autofill kept populating it with saved profile data (first the name
  // `company` picked up the Organization field, then `reg_note` picked up the city),
  // so every trip it ever logged was a real person. And it never defended against the
  // threat that matters: anyone using this endpoint as a mail relay POSTs JSON
  // directly and never renders the form, so they never see a honeypot at all.
  // Rate limiting is the real control here — see rateLimited() above.

  const reg: Registration = {
    name: clean(raw.name, 120),
    email: clean(raw.email, 160).toLowerCase(),
    phone: clean(raw.phone, 40),
    sector: clean(raw.sector, 80),
    registerAs: clean(raw.registerAs, 40),
    city: clean(raw.city, 80),
  }

  const missing = (Object.keys(reg) as (keyof Registration)[]).filter((k) => !reg[k])
  if (missing.length) {
    return NextResponse.json({ ok: false, error: `Missing: ${missing.join(', ')}.` }, { status: 400 })
  }
  if (!EMAIL_RE.test(reg.email)) {
    return NextResponse.json({ ok: false, error: 'That email address looks wrong.' }, { status: 400 })
  }

  // Rewrite the phone into the canonical shape before it is stored or emailed.
  const phone = normalisePhone(reg.phone)
  if (!phone) {
    return NextResponse.json(
      { ok: false, error: 'Enter a valid 10-digit Indian mobile number.' },
      { status: 400 }
    )
  }
  reg.phone = phone

  if (rateLimited(clientIp(req))) {
    return NextResponse.json(
      { ok: false, error: 'Too many registrations from this network. Try again later.' },
      { status: 429 }
    )
  }

  // 1. Record it. Everything else is secondary to not losing the lead.
  const recorded = await appendToSheet(reg)
  if (!recorded.ok) {
    console.error('[register] sheet append failed:', recorded.error)
    return NextResponse.json(
      { ok: false, error: 'We could not save your registration. Please try again.' },
      { status: 502 }
    )
  }

  // 2 + 3. Mail both sides concurrently; neither can fail the request.
  const now = new Date()

  const [toParticipant, toOrganiser] = await Promise.all([
    sendMail({ to: reg.email, ...participantEmail(reg) }),
    sendMail({ to: organiserRecipients, replyTo: reg.email, ...organiserEmail(reg, now) }),
  ])

  if (!toParticipant.ok) console.error('[register] participant mail failed:', toParticipant.error)
  if (!toOrganiser.ok) console.error('[register] organiser mail failed:', toOrganiser.error)

  return NextResponse.json({
    ok: true,
    mailed: toParticipant.ok,
  })
}

/** Health check: `curl https://…/api/register/` tells you what is actually wired. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'tier2-rising-registrations',
    sheet: SHEET_ENDPOINT ? 'configured' : 'NOT CONFIGURED',
    mail: mailConfigured() ? 'configured' : 'NOT CONFIGURED',
    organiser: organiserRecipients,
  })
}

/**
 * Append to the Google Sheet via the existing Apps Script Web App.
 *
 * Unlike the old browser-side call this runs server-side, so there is no CORS
 * constraint and we can finally read the response instead of firing blind.
 * Apps Script answers the /exec URL with a 302 to googleusercontent.com; fetch
 * follows it by default and the JSON body arrives from there.
 */
async function appendToSheet(reg: Registration): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!SHEET_ENDPOINT) return { ok: false, error: 'NEXT_PUBLIC_REGISTRATION_ENDPOINT is not set' }
  try {
    const res = await fetch(SHEET_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(reg as unknown as Record<string, string>),
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
