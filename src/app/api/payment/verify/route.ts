/**
 * POST /api/payment/verify — called by the browser the instant Checkout succeeds.
 *
 * This is the FAST path, not the reliable one. The reliable one is the webhook, which
 * does not depend on the customer's browser still being open, their tunnel surviving,
 * or their phone not ringing mid-redirect. Everything here is safe to lose; if it is
 * lost, /api/payment/webhook or /api/payment/reconcile finishes the job.
 *
 * THE RESPONSE CONTRACT — the most important thing in this file:
 *
 *   Once money is captured, THIS ENDPOINT NEVER TELLS THE CUSTOMER SOMETHING WENT
 *   WRONG. A person who has just been charged and then sees an error will, reliably,
 *   pay again. Every post-capture outcome returns ok:true; the difference between a
 *   clean fulfilment and a failed one is a softer message to them and a loud alert to
 *   us. The only failures reported as failures are ones where no money moved.
 */

import { NextResponse } from 'next/server'
import { clean } from '@/lib/submission'
import { verifyCheckoutSignature, paymentConfig } from '@/lib/payments/razorpay'
import { settle } from '@/lib/payments/fulfil'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const cfg = paymentConfig()
  if (!cfg.ok || !cfg.enabled) {
    return NextResponse.json({ ok: false, error: 'Payment is not enabled.' }, { status: 404 })
  }

  let raw: Record<string, unknown>
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body.' }, { status: 400 })
  }

  const orderId = clean(raw.razorpay_order_id, 64)
  const paymentId = clean(raw.razorpay_payment_id, 64)
  const signature = clean(raw.razorpay_signature, 256)

  if (!orderId || !paymentId || !signature) {
    return NextResponse.json({ ok: false, error: 'Incomplete payment response.' }, { status: 400 })
  }

  /*
   * Reject forgeries before spending an API call on them.
   *
   * This proves the message came from Razorpay. It does NOT prove the money moved —
   * settle() re-fetches the payment and checks status and amount for that. Treating a
   * valid signature as proof of payment is the classic way to get a free ticket.
   */
  if (!verifyCheckoutSignature(orderId, paymentId, signature)) {
    console.error(`[payments] BAD SIGNATURE order=${orderId} payment=${paymentId}`)
    return NextResponse.json({ ok: false, error: 'Payment could not be verified.' }, { status: 400 })
  }

  const result = await settle({ orderId, paymentId, source: 'verify' })

  switch (result.status) {
    case 'fulfilled':
      return NextResponse.json({
        ok: true,
        paid: true,
        recorded: true,
        // True when the webhook beat the browser to it. The customer still sees one
        // success screen and has received exactly one receipt.
        alreadyProcessed: result.alreadyDone,
        paymentId: result.record.paymentId,
      })

    case 'fulfil_failed':
      // Charged, not recorded, organiser alerted. Reassure and stop — do not invite a
      // retry, which would take a second payment for the same seat.
      return NextResponse.json({
        ok: true,
        paid: true,
        recorded: false,
        paymentId: result.record.paymentId,
        message:
          'Your payment went through and we have your details. Your confirmation email may take a ' +
          'little longer than usual — our team has been notified and will confirm personally. ' +
          'Please do not pay again.',
      })

    case 'not_paid':
      return NextResponse.json(
        { ok: false, paid: false, error: 'That payment did not complete. You have not been charged.' },
        { status: 402 },
      )

    case 'unknown':
    default:
      /*
       * The dangerous middle. Razorpay is unreachable or the state is ambiguous, so we
       * cannot say whether money moved. Never assert "you were not charged" here — if
       * the payment did land, the webhook and the reconcile sweep will still fulfil it.
       * The wording is chosen to stop the customer paying twice while we find out.
       */
      console.error(`[payments] verify unresolved order=${orderId}: ${result.reason}`)
      return NextResponse.json(
        {
          ok: true,
          paid: null,
          recorded: false,
          message:
            "We're confirming your payment with the bank. If it went through you'll get an email " +
            'shortly — please do not pay again. Contact us if you have not heard within an hour.',
        },
        { status: 202 },
      )
  }
}
