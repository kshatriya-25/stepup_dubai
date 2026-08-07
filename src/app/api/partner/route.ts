/**
 * POST /api/partner — "Partner with us" enquiries from the Participate modal.
 *
 * Mirrors /api/register exactly: record first, then mail both sides, and never let a
 * mail failure lose the enquiry. A sponsor lead is worth more than a confirmation
 * email, so only the sheet write can fail the request.
 *
 * The row lands in a separate `Partners` tab via the same Apps Script deployment —
 * see registration/Code.gs.
 */

import { NextResponse } from 'next/server'
import { sendMail, partnerRecipients, mailConfigured } from '@/lib/email/mailer'
import { partnerEnquiryEmail, partnerOrganiserEmail, type PartnerEnquiry } from '@/lib/email/templates'
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

const LABELS: Record<keyof PartnerEnquiry, string> = {
  name: 'name',
  businessName: 'business name',
  email: 'email',
  phone: 'phone',
}

export async function POST(req: Request) {
  let raw: Record<string, unknown>
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body.' }, { status: 400 })
  }

  const enquiry: PartnerEnquiry = {
    name: clean(raw.name, 120),
    businessName: clean(raw.businessName, 160),
    email: clean(raw.email, 160).toLowerCase(),
    phone: clean(raw.phone, 40),
  }

  const missing = (Object.keys(enquiry) as (keyof PartnerEnquiry)[]).filter((k) => !enquiry[k])
  if (missing.length) {
    return NextResponse.json(
      { ok: false, error: `Missing: ${missing.map((k) => LABELS[k]).join(', ')}.` },
      { status: 400 }
    )
  }
  if (!EMAIL_RE.test(enquiry.email)) {
    return NextResponse.json({ ok: false, error: 'That email address looks wrong.' }, { status: 400 })
  }

  const phone = normalisePhone(enquiry.phone)
  if (!phone) {
    return NextResponse.json(
      { ok: false, error: 'Enter a valid 10-digit Indian mobile number.' },
      { status: 400 }
    )
  }
  enquiry.phone = phone

  if (rateLimited(clientIp(req))) {
    return NextResponse.json(
      { ok: false, error: 'Too many submissions from this network. Try again later.' },
      { status: 429 }
    )
  }

  const recorded = await appendToSheet('partner', enquiry as unknown as Record<string, string>)
  if (!recorded.ok) {
    console.error('[partner] sheet append failed:', recorded.error)
    return NextResponse.json(
      { ok: false, error: 'We could not save your enquiry. Please try again.' },
      { status: 502 }
    )
  }

  const now = new Date()
  const [toPartner, toOrganiser] = await Promise.all([
    sendMail({ to: enquiry.email, ...partnerEnquiryEmail(enquiry) }),
    sendMail({ to: partnerRecipients, replyTo: enquiry.email, ...partnerOrganiserEmail(enquiry, now) }),
  ])

  if (!toPartner.ok) console.error('[partner] partner mail failed:', toPartner.error)
  if (!toOrganiser.ok) console.error('[partner] organiser mail failed:', toOrganiser.error)

  return NextResponse.json({ ok: true, mailed: toPartner.ok })
}

/** Health check, same shape as /api/register. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'tier2-rising-partner-enquiries',
    sheet: SHEET_ENDPOINT ? 'configured' : 'NOT CONFIGURED',
    mail: mailConfigured() ? 'configured' : 'NOT CONFIGURED',
    organiser: partnerRecipients,
  })
}
