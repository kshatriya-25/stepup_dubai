/**
 * POST /api/payment/webhook — Razorpay's server-to-server notification.
 *
 * THIS IS THE RELIABLE PATH. /verify depends on the customer's browser surviving the
 * moment after payment; this does not. If someone pays and immediately closes the tab,
 * loses signal, or their phone dies, this is what still books their seat.
 *
 * Configure in the Razorpay dashboard → Settings → Webhooks:
 *   URL     https://tier2rising.com/api/payment/webhook
 *   Secret  the same value as RAZORPAY_WEBHOOK_SECRET
 *   Events  payment.captured, payment.failed, order.paid
 *
 * RETRY SEMANTICS ARE LOAD-BEARING. Razorpay retries any non-2xx response with backoff
 * for roughly 24 hours, so a 500 here is a free, durable retry queue for a transient
 * Google Sheets outage. We return 500 deliberately when settlement is incomplete, and
 * 200 only when the job is genuinely done (or genuinely not ours to do). The alert
 * email is sent once per order, so retries do not produce an inbox storm.
 */

import { NextResponse } from 'next/server'
import { verifyWebhookSignature, webhookSecret, type RazorpayPayment } from '@/lib/payments/razorpay'
import { settle } from '@/lib/payments/fulfil'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type WebhookBody = {
  event?: string
  payload?: {
    payment?: { entity?: RazorpayPayment }
    order?: { entity?: { id?: string } }
  }
}

export async function POST(req: Request) {
  if (!webhookSecret) {
    // Refuse rather than trust. An unsigned webhook endpoint is an open door to
    // "fulfil this order" from anyone who can guess an order id.
    console.error('[payments] webhook hit but RAZORPAY_WEBHOOK_SECRET is not set')
    return NextResponse.json({ ok: false, error: 'Webhook not configured' }, { status: 503 })
  }

  // The signature covers the EXACT bytes Razorpay sent. Parsing to JSON and
  // re-serialising changes them (key order, whitespace, unicode escapes) and the
  // signature will never match — so read text first, verify, and only then parse.
  const rawBody = await req.text()
  const signature = req.headers.get('x-razorpay-signature') || ''

  if (!verifyWebhookSignature(rawBody, signature)) {
    console.error('[payments] webhook signature mismatch — rejecting')
    return NextResponse.json({ ok: false, error: 'Invalid signature' }, { status: 400 })
  }

  let body: WebhookBody
  try {
    body = JSON.parse(rawBody) as WebhookBody
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const event = body.event || ''
  const payment = body.payload?.payment?.entity
  const orderId = payment?.order_id || body.payload?.order?.entity?.id || ''

  if (!orderId) {
    // Nothing actionable, and retrying will not conjure an order id. 200 so Razorpay
    // stops resending it.
    console.warn(`[payments] webhook ${event} carried no order id — ignoring`)
    return NextResponse.json({ ok: true, ignored: true })
  }

  // Only events that can change settlement state. Everything else is acknowledged and
  // dropped so Razorpay does not retry events we will never act on.
  if (event !== 'payment.captured' && event !== 'order.paid' && event !== 'payment.failed') {
    return NextResponse.json({ ok: true, ignored: true, event })
  }

  const result = await settle({
    orderId,
    paymentId: payment?.id,
    /*
     * Trust the entity on the payment.* events and skip the extra API round trip.
     *
     * This is not the same as trusting a client: the HMAC over the raw body proves
     * these bytes came from Razorpay itself. The browser's /verify path deliberately
     * does NOT do this and always re-fetches, because there the signature only proves
     * the customer relayed a genuine Razorpay message — not that the message is
     * current.
     *
     * order.paid carries no payment entity, so settle() fetches it fresh.
     */
    payment: event === 'payment.captured' || event === 'payment.failed' ? payment : undefined,
    source: 'webhook',
  })

  switch (result.status) {
    case 'fulfilled':
      return NextResponse.json({ ok: true, status: 'fulfilled', alreadyDone: result.alreadyDone })

    case 'not_paid':
      // A real, terminal outcome. Recorded, nothing owed, nothing to retry.
      return NextResponse.json({ ok: true, status: 'not_paid' })

    case 'fulfil_failed':
      // Money captured, sheet write failed. 500 so Razorpay retries — this is the
      // cheapest durable retry queue available to us.
      console.error(`[payments] webhook fulfilment failed order=${orderId}: ${result.error}`)
      return NextResponse.json({ ok: false, status: 'fulfil_failed' }, { status: 500 })

    case 'unknown':
    default:
      console.error(`[payments] webhook unresolved order=${orderId}: ${result.reason}`)
      return NextResponse.json({ ok: false, status: 'unknown' }, { status: 500 })
  }
}

/** Health check. Confirms the route is reachable and whether the secret is present. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'tier2-rising-payment-webhook',
    secret: webhookSecret ? 'configured' : 'NOT CONFIGURED',
    events: ['payment.captured', 'payment.failed', 'order.paid'],
  })
}
