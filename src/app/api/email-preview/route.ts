/**
 * GET /api/email-preview?type=… — renders any of the transactional emails in the
 * browser with sample data, so copy and layout can be checked without submitting a
 * form or burning a Brevo send.
 *
 *   /api/email-preview                            → attendee confirmation
 *   /api/email-preview?type=organiser             → attendee notification
 *   /api/email-preview?type=partner               → partner acknowledgement
 *   /api/email-preview?type=partner-organiser     → partner notification
 *
 * Any field can be overridden by query param, e.g. &name=Priya&city=Salem.
 *
 * Disabled outside development — this endpoint would otherwise let anyone probe
 * the templates on the live site.
 */

import { NextResponse } from 'next/server'
import {
  participantEmail,
  organiserEmail,
  partnerEnquiryEmail,
  partnerOrganiserEmail,
  type Registration,
  type PartnerEnquiry,
} from '@/lib/email/templates'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SAMPLE: Registration = {
  name: 'Priya Raman',
  email: 'priya@example.com',
  phone: '+91 98765 43210',
  sector: 'Textiles and garments',
  registerAs: 'Company',
  city: 'Erode',
}

const SAMPLE_PARTNER: PartnerEnquiry = {
  name: 'Priya Raman',
  businessName: 'Kongu Textiles Pvt Ltd',
  email: 'priya@example.com',
  phone: '+91 98765 43210',
}

export async function GET(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ ok: false, error: 'Not available in production.' }, { status: 404 })
  }

  const q = new URL(req.url).searchParams
  const type = q.get('type') ?? 'participant'

  const reg: Registration = {
    name: q.get('name') || SAMPLE.name,
    email: q.get('email') || SAMPLE.email,
    phone: q.get('phone') || SAMPLE.phone,
    sector: q.get('sector') || SAMPLE.sector,
    registerAs: q.get('registerAs') || SAMPLE.registerAs,
    city: q.get('city') || SAMPLE.city,
  }
  const partner: PartnerEnquiry = {
    name: q.get('name') || SAMPLE_PARTNER.name,
    businessName: q.get('businessName') || SAMPLE_PARTNER.businessName,
    email: q.get('email') || SAMPLE_PARTNER.email,
    phone: q.get('phone') || SAMPLE_PARTNER.phone,
  }

  const mail =
    type === 'organiser'
      ? organiserEmail(reg)
      : type === 'partner'
        ? partnerEnquiryEmail(partner)
        : type === 'partner-organiser'
          ? partnerOrganiserEmail(partner)
          : participantEmail(reg)

  return new NextResponse(mail.html, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  })
}
