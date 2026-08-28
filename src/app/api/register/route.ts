/**
 * POST /api/register — free passes and waitlist entries. Never a payment.
 *
 * Does four things, in this order of importance:
 *   1. Writes the submission to the local lead log (@/lib/leads) — THE RECORD.
 *   2. Appends the row to the Google Sheet, which is a projection of 1.
 *   3. Emails the participant a confirmation.
 *   4. Emails the organiser a notification.
 *
 * ONLY STEP 1 CAN FAIL THE REQUEST. That is the inversion worth understanding: the Sheet
 * used to be the record, so a slow Apps Script, a mid-redeploy window, or a deployment
 * serving a version without the right columns returned 502 and the lead was gone —
 * somebody had typed a pitch into a form and we kept nothing at all.
 *
 * Now the disk is the record. A failed sheet write leaves the lead flagged unsynced for
 * /api/register/replay and alerts a human; the visitor is told they are on the list,
 * because they are. Steps 3 and 4 have always been best-effort for the same reason — a
 * captured lead with no confirmation email beats a visitor told "something went wrong"
 * who never comes back.
 *
 * Shared validation, throttling and the sheet write live in @/lib/submission, which
 * /api/partner uses too. This route is why next.config.mjs no longer sets
 * `output: 'export'`; see HOSTING.md.
 */

import { NextResponse } from 'next/server'
import { sendMail, organiserRecipients, mailConfigured } from '@/lib/email/mailer'
import { participantEmail, organiserEmail } from '@/lib/email/templates'
import { parseSubmission, sheetRow } from '@/lib/registration-input'
import { SHEET_ENDPOINT, rateLimited, clientIp, appendToSheet } from '@/lib/submission'
import { recordLead, markSynced, markFailed, leadsHealth, leadStats } from '@/lib/leads'
import { isFreePass, FREE_PASS_STATUS } from '@/content/tickets'

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
  // Browser autofill kept populating it with saved profile data, so every trip it ever
  // logged was a real person. And it never defended against the threat that matters:
  // anyone using this endpoint as a mail relay POSTs JSON directly and never renders the
  // form, so they never see a honeypot at all. Rate limiting is the real control here.

  /*
   * One parser, shared with /api/payment/order — see @/lib/registration-input.
   *
   * This endpoint now serves two cases that look identical on the wire: a waitlist entry
   * for a paid pass while the till is closed, and every Free Pass request (which has no
   * price, so it can never be a payment). Both are registrations; neither is a purchase.
   */
  const parsed = parseSubmission(raw)
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 })
  }
  const { ticket, reg } = parsed

  if (rateLimited(clientIp(req))) {
    return NextResponse.json(
      { ok: false, error: 'Too many registrations from this network. Try again later.' },
      { status: 429 }
    )
  }

  /*
   * 1. THE RECORD. Local disk, before anything that can be slow or someone else's.
   *
   * This is the only step allowed to fail the request, because it is the only step whose
   * failure means the details are nowhere at all.
   */
  let leadId: string
  try {
    leadId = recordLead(reg).id
  } catch (err) {
    const health = leadsHealth()
    console.error(`[register] CANNOT RECORD LEAD at ${health.path}:`, health.error || err)
    return NextResponse.json(
      { ok: false, error: 'We could not save your details. Please try again in a moment.' },
      { status: 503 }
    )
  }

  /*
   * 2. The Sheet — a projection, and best-effort.
   *
   * The Payment Status column is the point of writing it at all: left blank, these rows
   * are indistinguishable from a paid row whose payment columns failed to write, and the
   * two need very different follow-up.
   *
   * TWO VALUES, NOT ONE. This route handles both no-money cases and they are not the
   * same job. A free pass is a confirmed attendee who will walk up to the desk; a paid
   * pass submitted while the till was closed is somebody we owe a "passes are open"
   * email to. FREE_PASS_STATUS is shared with the organiser alert, which tells a human
   * exactly this string to search the sheet for.
   *
   * Rows written before this shipped were left as they were — see the note on
   * FREE_PASS_STATUS. The column is therefore not uniform, and the door list keys off
   * Ticket rather than status so it does not have to be.
   */
  const paymentStatus = isFreePass(ticket) ? FREE_PASS_STATUS : 'Waitlist'
  const recorded = await appendToSheet('registration', sheetRow(reg, { paymentStatus }))
  if (recorded.ok) {
    markSynced(leadId)
  } else {
    // Not an error the visitor sees. We have their details; what failed is our copy of
    // them going somewhere convenient, and that is recoverable without them.
    console.error('[register] sheet append failed (lead is safe, queued for replay):', recorded.error)
    markFailed(leadId, recorded.error, 1)
  }

  // 2 + 3. Mail both sides concurrently; neither can fail the request.
  const now = new Date()

  const [toParticipant, toOrganiser] = await Promise.all([
    sendMail({ to: reg.email, ...participantEmail(reg, ticket) }),
    sendMail({ to: organiserRecipients, replyTo: reg.email, ...organiserEmail(reg, now, ticket) }),
  ])

  if (!toParticipant.ok) console.error('[register] participant mail failed:', toParticipant.error)
  if (!toOrganiser.ok) console.error('[register] organiser mail failed:', toOrganiser.error)

  return NextResponse.json({
    ok: true,
    mailed: toParticipant.ok,
    // Surfaced so a monitoring check can see drift without reading the log. The browser
    // ignores it: from the visitor's side the answer is the same either way.
    sheetSynced: recorded.ok,
  })
}

/** Health check: `curl https://…/api/register` tells you what is actually wired. */
export async function GET() {
  const leads = leadsHealth()
  const counts = leadStats()
  return NextResponse.json(
    {
      // `ok` follows the LEAD LOG, not the sheet. If the disk is unwritable this endpoint
      // must fail a monitoring check even when Apps Script is perfectly healthy, because
      // the next submission will be refused.
      ok: leads.healthy,
      service: 'tier2-rising-registrations',
      leadLog: { writable: leads.healthy, path: leads.path, error: leads.error, ...counts },
      sheet: SHEET_ENDPOINT ? 'configured' : 'NOT CONFIGURED',
      mail: mailConfigured() ? 'configured' : 'NOT CONFIGURED',
      organiser: organiserRecipients,
    },
    { status: leads.healthy ? 200 : 500 },
  )
}
