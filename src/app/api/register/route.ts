/**
 * POST /api/register — attendee registration.
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
 * Shared validation, throttling and the sheet write live in @/lib/submission, which
 * /api/partner uses too. This route is why next.config.mjs no longer sets
 * `output: 'export'`; see HOSTING.md.
 */

import { NextResponse } from 'next/server'
import { sendMail, organiserRecipients, mailConfigured } from '@/lib/email/mailer'
import { participantEmail, organiserEmail, type Registration } from '@/lib/email/templates'
import { ticketById, ticketAccess } from '@/content/tickets'
import {
  SHEET_ENDPOINT,
  EMAIL_RE,
  clean,
  normalisePhone,
  rateLimited,
  clientIp,
  appendToSheet,
} from '@/lib/submission'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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
  // Rate limiting is the real control here — see rateLimited() in @/lib/submission.

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

  /*
   * Which pass they were looking at when they joined the list.
   *
   * Optional, and validated against the catalogue rather than trusted: a request that
   * names no ticket, or an unknown one, is still a perfectly good registration and is
   * recorded without one. The id never reaches the sheet — only the name and access
   * the server resolved from it — so a junk value cannot write a junk column.
   *
   * 'Waitlist' in the Payment Status column is the point of this. Left blank, these
   * rows are indistinguishable from a paid row whose payment columns failed to write,
   * and the two need very different follow-up.
   */
  const ticket = ticketById(clean(raw.ticketId, 40))

  // 1. Record it. Everything else is secondary to not losing the lead.
  const recorded = await appendToSheet('registration', {
    ...(reg as unknown as Record<string, string>),
    paymentStatus: 'Waitlist',
    ticket: ticket ? ticket.name : '',
    access: ticket ? ticketAccess(ticket.id) || '' : '',
  })
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

/** Health check: `curl https://…/api/register` tells you what is actually wired. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'tier2-rising-registrations',
    sheet: SHEET_ENDPOINT ? 'configured' : 'NOT CONFIGURED',
    mail: mailConfigured() ? 'configured' : 'NOT CONFIGURED',
    organiser: organiserRecipients,
  })
}
