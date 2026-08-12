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
      Two days in Erode where investors, government scheme officers and bank credit heads come to Tier-2, instead of the other way round. Five Growth Zones open all day, ten startups coached, three pitching live on the main stage.
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
      <tr><td style="padding:6px 0;font-size:14px;color:#7A8798;">Sector</td><td style="padding:6px 0;font-size:14px;color:#3D4A5C;">{{SECTOR}}</td></tr>
      <tr><td style="padding:6px 0;font-size:14px;color:#7A8798;">Registered as</td><td style="padding:6px 0;font-size:14px;color:#3D4A5C;">{{REGISTERED_AS}}</td></tr>
      <tr><td style="padding:6px 0;font-size:14px;color:#7A8798;">City</td><td style="padding:6px 0;font-size:14px;color:#3D4A5C;">{{CITY}}</td></tr>
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
 * Shown only when the keys are `rzp_test_…`. Without it a test-mode receipt is
 * indistinguishable from a real one, which is how a staging email ends up forwarded to
 * an accountant. Never rendered in live mode.
 */
export const TEST_MODE_BANNER = `  <tr><td style="background:#FFF4E5;border-bottom:1px solid #F0D9B5;padding:12px 32px;font-size:12px;font-weight:700;letter-spacing:0.4px;color:#8A5A00;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
    TEST MODE — no real money was charged. This is not a valid receipt.
  </td></tr>
`
