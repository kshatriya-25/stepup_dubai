/**
 * GET /api/email-preview?type=participant — renders a registration email in the
 * browser with sample data, so copy and layout can be checked without submitting
 * the form or burning a Brevo send.
 *
 *   /api/email-preview                    → participant confirmation
 *   /api/email-preview?type=organiser     → organiser notification
 *   /api/email-preview?type=organiser&name=Priya&city=Salem
 *
 * Disabled outside development — this endpoint would otherwise let anyone probe
 * the templates on the live site.
 */

import { NextResponse } from 'next/server'
import { participantEmail, organiserEmail, type Registration } from '@/lib/email/templates'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SAMPLE: Registration = {
  name: 'Priya Raman',
  email: 'priya@example.com',
  phone: '+91 98765 43210',
  sector: 'Textiles and garments',
  city: 'Erode',
}

export async function GET(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ ok: false, error: 'Not available in production.' }, { status: 404 })
  }

  const q = new URL(req.url).searchParams
  const reg: Registration = {
    name: q.get('name') || SAMPLE.name,
    email: q.get('email') || SAMPLE.email,
    phone: q.get('phone') || SAMPLE.phone,
    sector: q.get('sector') || SAMPLE.sector,
    city: q.get('city') || SAMPLE.city,
  }

  const mail = q.get('type') === 'organiser' ? organiserEmail(reg) : participantEmail(reg)

  return new NextResponse(mail.html, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  })
}
