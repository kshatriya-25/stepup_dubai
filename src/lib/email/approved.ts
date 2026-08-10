/**
 * Approved outbound email markup — DO NOT HAND-EDIT THE HTML.
 *
 * These two templates were signed off by the client as finished artwork. They are
 * stored verbatim (only the authoring comment header is stripped) so that what ships
 * is byte-for-byte what was approved, and so a revised file from the designer can be
 * dropped straight back in.
 *
 * Consequences of that, on purpose:
 *   - The palette here (#14315E navy, #E5762A orange) is the approved artwork's, not
 *     tailwind.config.ts's. Don't "correct" it to the site tokens.
 *   - The footer contact and the CTA URL are baked into the markup rather than read
 *     from src/content/site.ts. Changing site.ts will NOT change those.
 *
 * ONE deliberate exception: the event date and location are {{EVENT_DATES}} /
 * {{EVENT_LOCATION}}, fed from site.ts. The approved artwork said "Sunday, 11 October
 * 2026" while the website said "10 & 11 October 2026" — a registrant would have been
 * told two different things. Driving both from one source means that cannot recur.
 * The body prose was corrected from "A single day in Erode" for the same reason.
 *
 * Tokens are {{UPPER_SNAKE}} and are filled by fillTokens() in templates.ts, which
 * HTML-escapes every value. Add a token here and you must supply it there.
 *
 * Source files: Desktop/01-registrant-confirmation.html, 02-partner-confirmation.html
 */

/** Subject/preheader come from the approved files' header comments. */
export const REGISTRANT_SUBJECT = "{{FIRST_NAME}}, you're on the Tier-2 Rising waitlist"
export const PARTNER_SUBJECT = "We've received your enquiry, {{CONTACT_FIRST_NAME}}"

export const REGISTRANT_CONFIRMATION_HTML = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>You're on the list</title></head>
<body style="margin:0;padding:0;background:#F4F6F9;">
<div style="display:none;font-size:1px;color:#F4F6F9;max-height:0;overflow:hidden;">Early-bird tickets and payment links open soon. You'll be notified first.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F4F6F9;"><tr><td align="center" style="padding:28px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background:#FFFFFF;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

  <tr><td style="height:4px;background:#E5762A;line-height:4px;font-size:0;">&nbsp;</td></tr>
  <tr><td style="background:#14315E;padding:22px 32px;">
    <div style="font-size:19px;font-weight:700;letter-spacing:1.2px;color:#FFFFFF;">TIER-2 RISING</div>
    <div style="font-size:10px;font-weight:700;letter-spacing:2.4px;color:#E5762A;padding-top:4px;">STARTUP SUMMIT</div>
  </td></tr>

  <tr><td style="padding:34px 32px 0 32px;">
    <div style="font-size:10px;font-weight:700;letter-spacing:2px;color:#E5762A;">WAITLIST CONFIRMED</div>
    <h1 style="margin:12px 0 0 0;font-size:27px;line-height:1.25;font-weight:700;color:#14315E;">Thanks, {{FIRST_NAME}}. You're on the waitlist.</h1>
    <p style="margin:16px 0 0 0;font-size:15px;line-height:1.65;color:#3D4A5C;">
      Your details are in, and you're on the event waitlist. The summit is a paid ticket event, and ticketing isn't live yet — early-bird registration and the payment link are being set up now.
    </p>
    <p style="margin:12px 0 0 0;font-size:15px;line-height:1.65;color:#3D4A5C;">
      You'll be notified the moment the early-bird link opens. Waitlist entries get first access, along with the pricing and the agenda.
    </p>
    <p style="margin:12px 0 0 0;font-size:15px;line-height:1.65;color:#3D4A5C;">
      Two days in Erode where investors, government scheme officers and bank credit heads come to Tier-2, instead of the other way round. Five Growth Zones open all day, ten startups coached, three pitching live on the main stage.
    </p>
  </td></tr>

  <tr><td style="padding:22px 32px 0 32px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F4F6F9;border-left:4px solid #E5762A;">
      <tr><td style="padding:16px 20px;font-size:15px;line-height:1.6;color:#14315E;">
        <strong>{{EVENT_DATES}}</strong><br><span style="color:#5A6878;">{{EVENT_LOCATION}}</span>
      </td></tr>
    </table>
  </td></tr>

  <tr><td style="padding:26px 32px 0 32px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="background:#E5762A;">
      <a href="https://tier2rising.com/" style="display:inline-block;padding:14px 30px;font-size:12px;font-weight:700;letter-spacing:1.6px;color:#FFFFFF;text-decoration:none;">EXPLORE THE SUMMIT</a>
    </td></tr></table>
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

  <tr><td style="padding:24px 32px 32px 32px;font-size:15px;line-height:1.6;color:#14315E;font-weight:700;">
    See you in Erode.<br><span style="font-weight:400;color:#7A8798;font-size:14px;">Team Tier-2 Rising · NammaOffice</span>
  </td></tr>

  <tr><td style="background:#0B1F3F;padding:24px 32px;">
    <div style="font-size:12px;font-weight:700;letter-spacing:1.2px;color:#FFFFFF;">TIER-2 RISING STARTUP SUMMIT</div>
    <div style="font-size:12px;line-height:1.7;color:#9FB2CE;padding-top:8px;">
      NammaOffice Presents · In association with Startup Singam<br>
      <a href="mailto:info@tier2rising.com" style="color:#E5762A;text-decoration:none;">info@tier2rising.com</a> · <a href="tel:+919092109213" style="color:#E5762A;text-decoration:none;">+91 90921 09213</a><br>
      <span style="color:#6E86A8;">You joined the waitlist for the Tier-2 Rising Startup Summit on tier2rising.com.</span>
    </div>
  </td></tr>

</table></td></tr></table></body></html>`

export const PARTNER_CONFIRMATION_HTML = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Enquiry received</title></head>
<body style="margin:0;padding:0;background:#F4F6F9;">
<div style="display:none;font-size:1px;color:#F4F6F9;max-height:0;overflow:hidden;">Your enquiry is with the organising committee. The team will get back to you.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F4F6F9;"><tr><td align="center" style="padding:28px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background:#FFFFFF;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

  <tr><td style="height:4px;background:#E5762A;line-height:4px;font-size:0;">&nbsp;</td></tr>
  <tr><td style="background:#14315E;padding:22px 32px;">
    <div style="font-size:19px;font-weight:700;letter-spacing:1.2px;color:#FFFFFF;">TIER-2 RISING</div>
    <div style="font-size:10px;font-weight:700;letter-spacing:2.4px;color:#E5762A;padding-top:4px;">STARTUP SUMMIT</div>
  </td></tr>

  <tr><td style="padding:34px 32px 0 32px;">
    <div style="font-size:10px;font-weight:700;letter-spacing:2px;color:#E5762A;">ENQUIRY RECEIVED</div>
    <h1 style="margin:12px 0 0 0;font-size:27px;line-height:1.25;font-weight:700;color:#14315E;">Thanks, {{CONTACT_FIRST_NAME}}. We've got your enquiry.</h1>
    <p style="margin:16px 0 0 0;font-size:15px;line-height:1.65;color:#3D4A5C;">
      Your partnership enquiry for <strong style="color:#14315E;">{{COMPANY_NAME}}</strong> with the Tier-2 Rising organising committee. Someone from the team will get back to you shortly.
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
      <tr><td colspan="2" style="padding:16px 0 6px 0;font-size:10px;font-weight:700;letter-spacing:1.6px;color:#7A8798;">WHAT YOU SENT</td></tr>
      <tr><td width="130" style="padding:6px 0;font-size:14px;color:#7A8798;">Company</td><td style="padding:6px 0;font-size:14px;color:#3D4A5C;">{{COMPANY_NAME}}</td></tr>
      <tr><td style="padding:6px 0;font-size:14px;color:#7A8798;">Contact</td><td style="padding:6px 0;font-size:14px;color:#3D4A5C;">{{CONTACT_NAME}}</td></tr>
      <tr><td style="padding:6px 0;font-size:14px;color:#7A8798;">Email</td><td style="padding:6px 0;font-size:14px;color:#3D4A5C;">{{EMAIL}}</td></tr>
      <tr><td style="padding:6px 0;font-size:14px;color:#7A8798;">Phone</td><td style="padding:6px 0;font-size:14px;color:#3D4A5C;">{{PHONE}}</td></tr>
    </table>
  </td></tr>

  <tr><td style="padding:26px 32px 32px 32px;font-size:15px;line-height:1.6;color:#14315E;font-weight:700;">
    Thanks for looking at Erode.<br><span style="font-weight:400;color:#7A8798;font-size:14px;">Team Tier-2 Rising · NammaOffice</span>
  </td></tr>

  <tr><td style="background:#0B1F3F;padding:24px 32px;">
    <div style="font-size:12px;font-weight:700;letter-spacing:1.2px;color:#FFFFFF;">TIER-2 RISING STARTUP SUMMIT</div>
    <div style="font-size:12px;line-height:1.7;color:#9FB2CE;padding-top:8px;">
      NammaOffice Presents · In association with Startup Singam<br>
      <a href="mailto:info@tier2rising.com" style="color:#E5762A;text-decoration:none;">info@tier2rising.com</a> · <a href="tel:+919092109213" style="color:#E5762A;text-decoration:none;">+91 90921 09213</a>
    </div>
  </td></tr>

</table></td></tr></table></body></html>`
