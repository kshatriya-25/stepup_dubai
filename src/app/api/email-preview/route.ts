/**
 * GET /api/email-preview?type=… — renders any of the transactional emails in the browser
 * with sample data, so copy and layout can be checked without submitting a form, taking a
 * payment, or burning a Brevo send.
 *
 *   /api/email-preview                          → waitlist confirmation (paid pass, till shut)
 *   /api/email-preview?type=organiser           → waitlist notification
 *   /api/email-preview?type=free                → free-pass confirmation
 *   /api/email-preview?type=free-organiser      → free-pass notification
 *   /api/email-preview?type=paid                → THE RECEIPT
 *   /api/email-preview?type=paid-organiser      → paid notification
 *   /api/email-preview?type=unfulfilled         → the paid-but-not-recorded alert
 *   /api/email-preview?type=partner             → partner acknowledgement
 *   /api/email-preview?type=partner-organiser   → partner notification
 *
 * `&text=1` shows the text/plain part instead of the HTML, which is the half nobody looks
 * at and the half that has broken twice. `&subject=1` prints the subject line alone.
 *
 * WHICH PASS, AND WHETHER A COUPON WAS USED, ARE PARAMETERS. Four passes ask four different
 * sets of questions and print four different sets of rows, and a discounted receipt has two
 * rows a full-price one does not, so a single sample would leave most of the templates
 * unviewed:
 *
 *   &ticket=free | delegate | workshop | investor-pitch
 *   &coupon=SINGAM20&discount=100        — the receipt's price breakdown, in rupees off
 *
 * Any sample field can be overridden the same way, e.g. &name=Priya&city=Salem.
 *
 * Disabled outside development — this endpoint would otherwise let anyone probe the
 * templates, and the sample data, on the live site.
 */

import { NextResponse } from 'next/server'
import {
  participantEmail,
  organiserEmail,
  paidParticipantEmail,
  paidOrganiserEmail,
  unfulfilledAlertEmail,
  partnerEnquiryEmail,
  partnerOrganiserEmail,
  type Registration,
  type PaymentInfo,
  type PartnerEnquiry,
} from '@/lib/email/templates'
import { ticketById, ticketPaise, coFounderOptions } from '@/content/tickets'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/*
 * One sample person, filled out as far as any pass asks. Fields a given pass does not ask
 * are dropped by the templates themselves (see passDetailRows), so an over-complete sample
 * is the right kind: it exercises every row that can appear rather than none of them.
 */
const SAMPLE: Registration = {
  name: 'Priya Raman',
  email: 'priya@example.com',
  phone: '+91 98765 43210',
  city: 'Erode',
  sector: 'Textiles and garments',
  registerAs: '',
  startupName: 'Kongu Looms',
  stage: 'early',
  pitchOneLine: 'Power-loom clusters sell direct to brands instead of through agents.',
  pitchDetail: 'Agents take 18% and pay in 90 days. We aggregate 40 looms and sell direct.',
  traction: '₹42L run rate, 6 brands',
  workshop: 'workshop-2',
  wantNetworking: 'yes',
  meetingType: 'investor',
  meetingNote: 'Looking for a seed cheque and one retail partner.',
  coFounder: coFounderOptions[0].value,
  coFounderName: 'Arun Kumar',
  coFounderPhone: '+91 90000 11111',
  extraMembers: '0',
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
  const ticket = ticketById(q.get('ticket') || 'workshop') || ticketById('workshop')!

  const reg: Registration = {
    ...SAMPLE,
    name: q.get('name') || SAMPLE.name,
    email: q.get('email') || SAMPLE.email,
    phone: q.get('phone') || SAMPLE.phone,
    city: q.get('city') || SAMPLE.city,
    sector: q.get('sector') || SAMPLE.sector,
    registerAs: q.get('registerAs') || SAMPLE.registerAs,
    // Only the passes that ask these keep them, so a Delegate Pass preview is not a
    // founder's preview with the pass name swapped.
    ...(ticket.form.startup
      ? {}
      : { startupName: '', stage: '', pitchOneLine: '', pitchDetail: '', traction: '' }),
    ...(ticket.form.workshop ? {} : { workshop: '', wantNetworking: '', meetingType: '', meetingNote: '' }),
    ...(ticket.includesCoFounder ? {} : { coFounder: '', coFounderName: '', coFounderPhone: '' }),
  }

  /*
   * The coupon reaches the emails through PaymentInfo, NOT through the registration — the
   * type above is the view the templates get and it has no coupon field, deliberately: a
   * coupon is a fact about the payment, and only the paid templates have any business
   * knowing about it. See the note on Registration in @/lib/email/templates.
   */
  const couponCode = (q.get('coupon') || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  const discountPaise = couponCode
    ? Math.max(0, Number.parseInt(q.get('discount') || '100', 10) || 0) * 100
    : 0
  const amountPaise = Math.max(100, ticketPaise(ticket) - discountPaise)

  const pay: PaymentInfo = {
    paymentId: 'pay_SAMPLE0000001',
    orderId: 'order_SAMPLE000001',
    amountPaise,
    amountLabel: `₹${(amountPaise / 100).toLocaleString('en-IN')}`,
    ticketName: ticket.name,
    ticketId: ticket.id,
    paidAt: new Date(),
    method: 'upi',
    couponCode: couponCode || undefined,
    discountPaise,
    caveat: null,
  }
  const partner: PartnerEnquiry = {
    name: q.get('name') || SAMPLE_PARTNER.name,
    businessName: q.get('businessName') || SAMPLE_PARTNER.businessName,
    email: q.get('email') || SAMPLE_PARTNER.email,
    phone: q.get('phone') || SAMPLE_PARTNER.phone,
  }

  const mail = (() => {
    switch (type) {
      case 'organiser':
        return organiserEmail(reg, new Date(), ticket)
      // participantEmail / organiserEmail pick the free-pass artwork from the TICKET, not
      // from an argument — so these two are the same calls with a free pass, and that is
      // the point: the preview exercises the real branch.
      case 'free':
        return participantEmail(reg, ticketById('free')!)
      case 'free-organiser':
        return organiserEmail(reg, new Date(), ticketById('free')!)
      case 'paid':
        return paidParticipantEmail(reg, pay)
      case 'paid-organiser':
        return paidOrganiserEmail(reg, pay)
      case 'unfulfilled':
        return unfulfilledAlertEmail(reg, pay, 'Apps Script returned 500')
      case 'partner':
        return partnerEnquiryEmail(partner)
      case 'partner-organiser':
        return partnerOrganiserEmail(partner)
      default:
        return participantEmail(reg, ticket)
    }
  })()

  if (q.get('subject')) return new NextResponse(mail.subject, { headers: { 'content-type': 'text/plain' } })
  if (q.get('text')) {
    return new NextResponse(mail.text, { headers: { 'content-type': 'text/plain; charset=utf-8' } })
  }
  return new NextResponse(mail.html, { headers: { 'content-type': 'text/html; charset=utf-8' } })
}
