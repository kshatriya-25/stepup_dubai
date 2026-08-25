/**
 * Paid-registration confirmation — the receipt.
 *
 * WHY THIS IS A SEPARATE TEMPLATE FROM approved.ts
 * The client-approved registrant email is a WAITLIST email. It says, in the customer's
 * own words back to them, "the summit is a paid ticket event, and ticketing isn't live
 * yet — early-bird registration and the payment link are being set up now."
 *
 * Sending that to somebody who has just been charged would tell them their money went
 * somewhere it shouldn't have. That reliably produces support tickets, chargebacks and
 * duplicate payments from people who assume the first attempt failed. So the waitlist
 * template stays exactly as approved and is still used whenever payment is switched
 * off, and this one — same 600px shell, same #14315E / #E5762A palette, same footer —
 * is used once money has actually been captured.
 *
 * NEEDS CLIENT SIGN-OFF like the other two did. The layout is deliberately unchanged
 * so the diff they review is copy plus the receipt panel, nothing structural.
 *
 * Everything a customer might need in a dispute is on the page: amount, payment id,
 * order id and timestamp. The payment id is what Razorpay support and the bank will
 * both ask for, so it is selectable text, not an image.
 *
 * THE "SECTOR" ROW IS GONE. Sector is now asked only on the Investor Pitch Pass, so on
 * three of the four passes that row rendered as a label with nothing beside it. It moved
 * into {{EXTRA_ROWS}}, which is filled only with the rows that this pass actually has —
 * organisation, startup, workshop, team size. A receipt should not have blanks in it.
 *
 * {{ACCESS}} IS NOT DECORATION. It is filled from the bought ticket's own Access value
 * in @/content/tickets — the same string the pass card on the site prints. This used to
 * be a flat "Two days in Erode" sentence, which stopped being true twice over — first
 * when the Delegate Pass changed to Day 2 only, then when the summit itself became a
 * single day. Both times the receipt was promising something the pass did not admit.
 * Sourcing it from the catalogue means changing a pass's access changes what its
 * receipt claims, in one edit, and the two cannot disagree again.
 */

export const PAID_SUBJECT = '{{FIRST_NAME}}, your Tier-2 Rising seat is confirmed'

export const PAID_CONFIRMATION_HTML = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Your seat is confirmed</title></head>
<body style="margin:0;padding:0;background:#F4F6F9;">
<div style="display:none;font-size:1px;color:#F4F6F9;max-height:0;overflow:hidden;">Payment received. Your seat at the Tier-2 Rising Startup Summit is confirmed.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F4F6F9;"><tr><td align="center" style="padding:28px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background:#FFFFFF;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

  <tr><td style="height:4px;background:#E5762A;line-height:4px;font-size:0;">&nbsp;</td></tr>
  <tr><td style="background:#14315E;padding:22px 32px;">
    <div style="font-size:19px;font-weight:700;letter-spacing:1.2px;color:#FFFFFF;">TIER-2 RISING</div>
    <div style="font-size:10px;font-weight:700;letter-spacing:2.4px;color:#E5762A;padding-top:4px;">STARTUP SUMMIT</div>
  </td></tr>
{{TEST_BANNER}}
  <tr><td style="padding:34px 32px 0 32px;">
    <div style="font-size:10px;font-weight:700;letter-spacing:2px;color:#E5762A;">PAYMENT RECEIVED</div>
    <h1 style="margin:12px 0 0 0;font-size:27px;line-height:1.25;font-weight:700;color:#14315E;">Thanks, {{FIRST_NAME}}. Your seat is confirmed.</h1>
    <p style="margin:16px 0 0 0;font-size:15px;line-height:1.65;color:#3D4A5C;">
      We've received your payment of <strong style="color:#14315E;">{{AMOUNT}}</strong> for the <strong style="color:#14315E;">{{TICKET}}</strong> and your place at the summit is booked. Keep this email — it's your receipt.
    </p>
    <p style="margin:12px 0 0 0;font-size:15px;line-height:1.65;color:#3D4A5C;">
      Erode is where investors, government scheme officers and bank credit heads come to Tier-2, instead of the other way round. 25 stalls, speaker sessions in the open hall, and a founder track that ends in a closed-room investor pitch.
    </p>
    <p style="margin:12px 0 0 0;font-size:15px;line-height:1.65;color:#3D4A5C;">
      Your {{TICKET}} opens <strong style="color:#14315E;">{{ACCESS}}</strong>.
    </p>
    <p style="margin:12px 0 0 0;font-size:15px;line-height:1.65;color:#3D4A5C;">
      Your entry pass and the full agenda reach you closer to the date, at this address.
    </p>
  </td></tr>

  <tr><td style="padding:22px 32px 0 32px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F4F6F9;border-left:4px solid #E5762A;">
      <tr><td style="padding:16px 20px;font-size:15px;line-height:1.6;color:#14315E;">
        <strong>{{EVENT_DATES}}</strong><br><span style="color:#5A6878;">{{EVENT_LOCATION}}</span>
      </td></tr>
    </table>
  </td></tr>

  <tr><td style="padding:28px 32px 0 32px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #E3E7ED;">
      <tr><td colspan="2" style="padding:16px 0 6px 0;font-size:10px;font-weight:700;letter-spacing:1.6px;color:#7A8798;">PAYMENT RECEIPT</td></tr>
      <tr><td width="130" style="padding:6px 0;font-size:14px;color:#7A8798;">Ticket</td><td style="padding:6px 0;font-size:14px;color:#14315E;font-weight:700;">{{TICKET}}</td></tr>
      <tr><td style="padding:6px 0;font-size:14px;color:#7A8798;">Access</td><td style="padding:6px 0;font-size:14px;color:#14315E;font-weight:700;">{{ACCESS}}</td></tr>
      <tr><td style="padding:6px 0;font-size:14px;color:#7A8798;">Amount paid</td><td style="padding:6px 0;font-size:14px;color:#14315E;font-weight:700;">{{AMOUNT}}</td></tr>
      <tr><td style="padding:6px 0;font-size:14px;color:#7A8798;">Paid on</td><td style="padding:6px 0;font-size:14px;color:#3D4A5C;">{{PAID_ON}}</td></tr>
      <tr><td style="padding:6px 0;font-size:14px;color:#7A8798;">Payment ID</td><td style="padding:6px 0;font-size:13px;color:#3D4A5C;font-family:Consolas,Monaco,monospace;">{{PAYMENT_ID}}</td></tr>
      <tr><td style="padding:6px 0;font-size:14px;color:#7A8798;">Order ID</td><td style="padding:6px 0;font-size:13px;color:#3D4A5C;font-family:Consolas,Monaco,monospace;">{{ORDER_ID}}</td></tr>
    </table>
  </td></tr>

  <tr><td style="padding:28px 32px 0 32px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #E3E7ED;">
      <tr><td colspan="2" style="padding:16px 0 6px 0;font-size:10px;font-weight:700;letter-spacing:1.6px;color:#7A8798;">YOUR DETAILS</td></tr>
      <tr><td width="130" style="padding:6px 0;font-size:14px;color:#7A8798;">Name</td><td style="padding:6px 0;font-size:14px;color:#3D4A5C;">{{NAME}}</td></tr>
      <tr><td style="padding:6px 0;font-size:14px;color:#7A8798;">Email</td><td style="padding:6px 0;font-size:14px;color:#3D4A5C;">{{EMAIL}}</td></tr>
      <tr><td style="padding:6px 0;font-size:14px;color:#7A8798;">Phone</td><td style="padding:6px 0;font-size:14px;color:#3D4A5C;">{{PHONE}}</td></tr>
      <tr><td style="padding:6px 0;font-size:14px;color:#7A8798;">Attending as</td><td style="padding:6px 0;font-size:14px;color:#3D4A5C;">{{REGISTERED_AS}}</td></tr>
      <tr><td style="padding:6px 0;font-size:14px;color:#7A8798;">City</td><td style="padding:6px 0;font-size:14px;color:#3D4A5C;">{{CITY}}</td></tr>
{{EXTRA_ROWS}}
    </table>
  </td></tr>

  <tr><td style="padding:26px 32px 0 32px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="background:#E5762A;">
      <a href="https://tier2rising.com/" style="display:inline-block;padding:14px 30px;font-size:12px;font-weight:700;letter-spacing:1.6px;color:#FFFFFF;text-decoration:none;">EXPLORE THE SUMMIT</a>
    </td></tr></table>
  </td></tr>

  <tr><td style="padding:24px 32px 32px 32px;font-size:15px;line-height:1.6;color:#14315E;font-weight:700;">
    See you in Erode.<br><span style="font-weight:400;color:#7A8798;font-size:14px;">Team Tier-2 Rising · NammaOffice</span>
  </td></tr>

  <tr><td style="background:#0B1F3F;padding:24px 32px;">
    <div style="font-size:12px;font-weight:700;letter-spacing:1.2px;color:#FFFFFF;">TIER-2 RISING STARTUP SUMMIT</div>
    <div style="font-size:12px;line-height:1.7;color:#9FB2CE;padding-top:8px;">
      NammaOffice Presents · In association with Startup Singam<br>
      <a href="mailto:{{CONTACT_EMAIL}}" style="color:#E5762A;text-decoration:none;">{{CONTACT_EMAIL}}</a> · <a href="tel:{{CONTACT_PHONE_HREF}}" style="color:#E5762A;text-decoration:none;">{{CONTACT_PHONE}}</a><br>
      <span style="color:#6E86A8;">You registered for the Tier-2 Rising Startup Summit on tier2rising.com. Questions about this payment? Reply with your Payment ID.</span>
    </div>
  </td></tr>

</table></td></tr></table></body></html>`

/**
 * WHY A RECEIPT MIGHT NOT BE A REAL ONE. null means it is.
 *
 * Two different things, and they must not be described with the same sentence:
 *
 *   'test-keys'  — `rzp_test_…`. No money existed at any point.
 *   'test-price' — LIVE keys against a staging build running TICKET_PRICE_OVERRIDE_INR
 *                  (see @/lib/pricing). The money is entirely real; the amount is not
 *                  what the pass costs, and the pass is not valid.
 *
 * The second case is the dangerous one and is why this stopped being a boolean. A ₹2
 * capture on live keys produces a receipt that is genuine in every mechanical respect —
 * real payment id, real settlement, reconcilable in the Razorpay dashboard. Calling that
 * "TEST MODE — no real money was charged" would be a false statement about someone's
 * bank account, and leaving it unmarked would let a staging booking be presented at the
 * registration desk.
 */
export type ReceiptCaveat = 'test-keys' | 'test-price' | null

const CAVEAT_LINE: Record<'test-keys' | 'test-price', string> = {
  'test-keys': 'TEST MODE — no real money was charged. This is not a valid receipt.',
  'test-price':
    'STAGING TEST — booked at a reduced test price. Real money was charged and will be refunded. This is not a valid pass.',
}

/** One-word mode, for the organiser's eyebrow line and the unfulfilled-payment alert. */
export const CAVEAT_LABEL: Record<'test-keys' | 'test-price', string> = {
  'test-keys': 'test mode',
  'test-price': 'staging test price',
}

/** Plain text of the caveat, or '' when the receipt is real. */
export function caveatLine(caveat: ReceiptCaveat): string {
  return caveat ? CAVEAT_LINE[caveat] : ''
}

/**
 * The HTML strip that goes above the receipt. Amber for a test key, red for a live-key
 * test price — the second one has taken somebody's money and needs to look like it.
 */
export function caveatBanner(caveat: ReceiptCaveat): string {
  if (!caveat) return ''
  const [bg, border, fg] =
    caveat === 'test-keys' ? ['#FFF4E5', '#F0D9B5', '#8A5A00'] : ['#FFF0F0', '#F0C4C4', '#A11B1B']
  return `  <tr><td style="background:${bg};border-bottom:1px solid ${border};padding:12px 32px;font-size:12px;font-weight:700;letter-spacing:0.4px;color:${fg};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
    ${CAVEAT_LINE[caveat]}
  </td></tr>
`
}
