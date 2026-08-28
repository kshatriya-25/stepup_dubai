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
 * told two different things. Driving both from one source means that cannot recur, and
 * it is why the August 2026 cut to a single day (Sat 10 Oct) reached this email for
 * free. The body prose is hard-coded and did NOT: "Two days in Erode" had to be edited
 * by hand. If the format changes again, re-read that paragraph.
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
      One day in Erode where investors, government scheme officers and bank credit heads come to Tier-2, instead of the other way round. Five Growth Zones open all day, ten startups coached, three pitching live on the main stage.
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
      <tr><td style="padding:6px 0;font-size:14px;color:#7A8798;">Pass</td><td style="padding:6px 0;font-size:14px;color:#14315E;font-weight:700;">{{PASS}}</td></tr>
      <tr><td style="padding:6px 0;font-size:14px;color:#7A8798;">Registered as</td><td style="padding:6px 0;font-size:14px;color:#3D4A5C;">{{REGISTERED_AS}}</td></tr>
      <tr><td style="padding:6px 0;font-size:14px;color:#7A8798;">City</td><td style="padding:6px 0;font-size:14px;color:#3D4A5C;">{{CITY}}</td></tr>
{{EXTRA_ROWS}}
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

/* ------------------------------------------------------------------ *
 * FREE PASS — registrant confirmation + internal alert
 *
 * Supplied August 2026, when free passes stopped being a waitlist. The two templates
 * above still exist and are still used: a PAID pass submitted while the till is closed
 * is genuinely a waitlist entry and must keep being told so. These two are only ever
 * sent for a pass with no price. See participantEmail()/organiserEmail() in templates.ts,
 * which branch on isFreePass().
 *
 * Verbatim apart from the token rewrite: the artwork uses {{lower_snake}} and
 * fillTokens only matches {{UPPER_SNAKE}}, so every placeholder was renamed to the
 * name templates.ts already supplies. Three things were tokenised that the artwork had
 * hard-coded, for the reason in this file's header — the event date, the venue, and the
 * "Incubation cell / company name" row label, which is wrong for two of the three
 * categories a free pass accepts (a TBI's organisation is a TBI, not a company).
 *
 * Source files: Desktop/registrant-confirmation-free-pass (1).html,
 *               Desktop/internal-alert-new-registration (2).html
 * ------------------------------------------------------------------ */

export const FREE_PASS_SUBJECT = "{{FIRST_NAME}}, you're registered — Tier-2 Rising Free Pass"

/** Organiser triage line. The pass is first because that is what decides the next step. */
export const FREE_PASS_ALERT_SUBJECT =
  'New registration — {{PASS}} — {{NAME}} · {{ORG_NAME}} · {{CITY}}'

export const FREE_PASS_CONFIRMATION_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>You're registered &middot; Tier-2 Rising Startup Summit</title>
<!--[if mso]>
<style>body,table,td,a{font-family:Arial,Helvetica,sans-serif !important;}</style>
<![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#F1F3F6;">
<div style="display:none;font-size:1px;color:#F1F3F6;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
  Your free pass is confirmed &middot; {{EVENT_DATES}} &middot; {{EVENT_LOCATION}}
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F1F3F6;">
<tr>
<td align="center" style="padding:24px 12px;">

  <table role="presentation" width="520" cellpadding="0" cellspacing="0" border="0" style="width:520px;max-width:520px;background-color:#FFFFFF;border-top:4px solid #E87722;">

    <!-- Header -->
    <tr>
      <td style="padding:0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#143563;">
          <tr>
            <td style="padding:24px 28px;font-family:Arial,Helvetica,sans-serif;">
              <div style="font-size:17px;line-height:22px;font-weight:bold;color:#FFFFFF;letter-spacing:0.5px;">TIER-2 RISING</div>
              <div style="font-size:10px;line-height:14px;font-weight:bold;color:#E87722;letter-spacing:1.6px;padding-top:4px;">STARTUP SUMMIT</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Eyebrow + headline + body -->
    <tr>
      <td style="padding:28px 28px 0 28px;font-family:Arial,Helvetica,sans-serif;">
        <div style="font-size:10px;line-height:14px;font-weight:bold;color:#E87722;letter-spacing:1.4px;text-transform:uppercase;">Registered &ndash; Free Pass Entry</div>

        <div style="font-size:22px;line-height:30px;font-weight:bold;color:#12305C;padding-top:12px;">Thanks, {{FIRST_NAME}}. You're registered.</div>

        <div style="font-size:13px;line-height:21px;color:#41639B;padding-top:16px;">Your details have been successfully registered, and your Free Pass is confirmed.</div>

        <div style="font-size:13px;line-height:21px;color:#41639B;padding-top:14px;">We will share the detailed agenda and check-in information closer to the event date. Please keep your valid ID card and registration details handy, as it will be required for verification at the registration desk. Please note that seating for the sessions will be available on a first-come, first-served basis.</div>

        <div style="font-size:13px;line-height:21px;color:#41639B;padding-top:14px;"><strong style="color:#12305C;">Free Pass Access:</strong> Your pass provides access to the Stall Area and Main Hall only. Access to other designated areas or sessions may require a separate pass.</div>

        <div style="font-size:13px;line-height:21px;color:#41639B;padding-top:14px;">One impactful day in Erode, where investors, government scheme officers, and bank credit heads come to Tier-2, bringing opportunities closer to entrepreneurs.</div>

        <div style="font-size:13px;line-height:21px;color:#41639B;padding-top:14px;">5 Growth Zones open throughout the day, 10 startups coached, and 3 startups pitching live on the main stage &mdash; all designed to connect, empower, and accelerate the next generation of businesses.</div>
      </td>
    </tr>

    <!-- Date / venue block -->
    <tr>
      <td style="padding:22px 28px 0 28px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F3F6FA;border-left:4px solid #E87722;">
          <tr>
            <td style="padding:16px 18px;font-family:Arial,Helvetica,sans-serif;">
              <div style="font-size:14px;line-height:20px;font-weight:bold;color:#12305C;">{{EVENT_DATES}}</div>
              <div style="font-size:12px;line-height:18px;color:#41639B;padding-top:4px;">{{EVENT_LOCATION}}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td style="padding:22px 28px 0 28px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="background-color:#E87722;">
              <a href="https://tier2rising.com/"
                 style="display:inline-block;padding:14px 26px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:bold;line-height:14px;letter-spacing:1.2px;text-transform:uppercase;color:#FFFFFF;text-decoration:none;">Explore the summit</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Your details -->
    <tr>
      <td style="padding:28px 28px 0 28px;font-family:Arial,Helvetica,sans-serif;">
        <div style="border-top:1px solid #E4E8EE;font-size:0;line-height:0;">&nbsp;</div>
        <div style="font-size:10px;line-height:14px;font-weight:bold;color:#8B93A3;letter-spacing:1.2px;text-transform:uppercase;padding-top:14px;">Your details</div>
      </td>
    </tr>
    <tr>
      <td style="padding:10px 28px 0 28px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,Helvetica,sans-serif;">
          <tr>
            <td width="150" style="padding:7px 12px 7px 0;font-size:12px;line-height:18px;color:#7C8CA6;vertical-align:top;">Name</td>
            <td style="padding:7px 0;font-size:12px;line-height:18px;color:#12305C;">{{NAME}}</td>
          </tr>
          <tr>
            <td width="150" style="padding:7px 12px 7px 0;font-size:12px;line-height:18px;color:#7C8CA6;vertical-align:top;">Email</td>
            <td style="padding:7px 0;font-size:12px;line-height:18px;color:#12305C;"><a href="mailto:{{EMAIL}}" style="color:#12305C;text-decoration:underline;">{{EMAIL}}</a></td>
          </tr>
          <tr>
            <td width="150" style="padding:7px 12px 7px 0;font-size:12px;line-height:18px;color:#7C8CA6;vertical-align:top;">Phone</td>
            <td style="padding:7px 0;font-size:12px;line-height:18px;color:#12305C;">{{PHONE}}</td>
          </tr>
          <tr>
            <td width="150" style="padding:7px 12px 7px 0;font-size:12px;line-height:18px;color:#7C8CA6;vertical-align:top;">Pass</td>
            <td style="padding:7px 0;font-size:12px;line-height:18px;color:#12305C;font-weight:bold;">{{PASS}}</td>
          </tr>
          <tr>
            <td width="150" style="padding:7px 12px 7px 0;font-size:12px;line-height:18px;color:#7C8CA6;vertical-align:top;">Registered as</td>
            <td style="padding:7px 0;font-size:12px;line-height:18px;color:#12305C;">{{REGISTERED_AS}}</td>
          </tr>
          <tr>
            <td width="150" style="padding:7px 12px 7px 0;font-size:12px;line-height:18px;color:#7C8CA6;vertical-align:top;">City</td>
            <td style="padding:7px 0;font-size:12px;line-height:18px;color:#12305C;">{{CITY}}</td>
          </tr>
          <tr>
            <td width="150" style="padding:7px 12px 7px 0;font-size:12px;line-height:18px;color:#7C8CA6;vertical-align:top;">{{ORG_LABEL}}</td>
            <td style="padding:7px 0;font-size:12px;line-height:18px;color:#12305C;">{{ORG_NAME}}</td>
          </tr>
          <tr>
            <td width="150" style="padding:7px 12px 7px 0;font-size:12px;line-height:18px;color:#7C8CA6;vertical-align:top;">ID / registration</td>
            <td style="padding:7px 0;font-size:12px;line-height:18px;color:#12305C;">{{ID_NUMBER}}</td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Sign off -->
    <tr>
      <td style="padding:26px 28px 30px 28px;font-family:Arial,Helvetica,sans-serif;">
        <div style="font-size:13px;line-height:20px;font-weight:bold;color:#12305C;">See you in Erode.</div>
        <div style="font-size:12px;line-height:18px;color:#41639B;padding-top:4px;">Team Tier-2 Rising &middot; NammaOffice</div>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding:0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0B2544;">
          <tr>
            <td style="padding:24px 28px;font-family:Arial,Helvetica,sans-serif;">
              <div style="font-size:12px;line-height:18px;font-weight:bold;color:#FFFFFF;letter-spacing:0.6px;">TIER-2 RISING STARTUP SUMMIT</div>
              <div style="font-size:11px;line-height:18px;color:#8FB0DA;padding-top:10px;">NammaOffice Presents &middot; In association with Startup Singam</div>
              <div style="font-size:11px;line-height:18px;padding-top:2px;"><a href="mailto:info@tier2rising.com" style="color:#E87722;text-decoration:none;font-weight:bold;">info@tier2rising.com</a> <span style="color:#8FB0DA;">&middot;</span> <span style="color:#E87722;font-weight:bold;">+91 90921 09213</span></div>
              <div style="font-size:10px;line-height:16px;color:#5C7CA8;padding-top:14px;">You registered for a free pass to the Tier-2 Rising Startup Summit on <a href="https://tier2rising.com/" style="color:#5C7CA8;text-decoration:underline;">tier2rising.com</a>.</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

  </table>

</td>
</tr>
</table>
</body>
</html>`

export const FREE_PASS_ALERT_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>New registration &middot; Tier-2 Rising Startup Summit</title>
<!--[if mso]>
<style>body,table,td,a{font-family:Arial,Helvetica,sans-serif !important;}</style>
<![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#F1F3F6;">
<div style="display:none;font-size:1px;color:#F1F3F6;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
  New registration &middot; {{NAME}} &middot; {{PASS}} &middot; {{CITY}}
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F1F3F6;">
<tr>
<td align="center" style="padding:24px 12px;">

  <table role="presentation" width="520" cellpadding="0" cellspacing="0" border="0" style="width:520px;max-width:520px;background-color:#FFFFFF;border:1px solid #E6E9EF;border-top:4px solid #E87722;">

    <!-- Header -->
    <tr>
      <td style="padding:20px 20px 0 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#143563;">
          <tr>
            <td style="padding:22px 24px;font-family:Arial,Helvetica,sans-serif;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left" style="vertical-align:top;">
                    <div style="font-size:17px;line-height:22px;font-weight:bold;color:#FFFFFF;letter-spacing:0.5px;">TIER-2 RISING</div>
                    <div style="font-size:10px;line-height:14px;font-weight:bold;color:#E87722;letter-spacing:1.6px;padding-top:4px;">STARTUP SUMMIT</div>
                  </td>
                  <td align="right" style="vertical-align:top;font-size:11px;line-height:16px;color:#C9D3E4;letter-spacing:0.5px;white-space:nowrap;">{{EVENT_DATES_SHORT}}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Eyebrow + name -->
    <tr>
      <td style="padding:26px 32px 0 32px;font-family:Arial,Helvetica,sans-serif;">
        <div style="font-size:10px;line-height:14px;font-weight:bold;color:#E87722;letter-spacing:1.4px;text-transform:uppercase;">Registered &ndash; Free Pass Entry</div>
        <div style="font-size:24px;line-height:30px;font-weight:bold;color:#12305C;padding-top:10px;">{{NAME}}</div>
        <div style="font-size:12px;line-height:18px;color:#6B7688;padding-top:6px;">Submitted {{SUBMITTED_AT}}</div>
      </td>
    </tr>

    <!-- Details -->
    <tr>
      <td style="padding:22px 32px 0 32px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,Helvetica,sans-serif;">

          <tr>
            <td width="140" style="padding:12px 12px 12px 0;border-top:1px solid #E4E8EE;font-size:10px;line-height:15px;font-weight:bold;color:#8B93A3;letter-spacing:1px;text-transform:uppercase;vertical-align:top;">Name</td>
            <td style="padding:12px 0;border-top:1px solid #E4E8EE;font-size:13px;line-height:19px;color:#12305C;">{{NAME}}</td>
          </tr>
          <tr>
            <td width="140" style="padding:12px 12px 12px 0;border-top:1px solid #E4E8EE;font-size:10px;line-height:15px;font-weight:bold;color:#8B93A3;letter-spacing:1px;text-transform:uppercase;vertical-align:top;">Email</td>
            <td style="padding:12px 0;border-top:1px solid #E4E8EE;font-size:13px;line-height:19px;color:#12305C;"><a href="mailto:{{EMAIL}}" style="color:#12305C;text-decoration:underline;">{{EMAIL}}</a></td>
          </tr>
          <tr>
            <td width="140" style="padding:12px 12px 12px 0;border-top:1px solid #E4E8EE;font-size:10px;line-height:15px;font-weight:bold;color:#8B93A3;letter-spacing:1px;text-transform:uppercase;vertical-align:top;">Phone</td>
            <td style="padding:12px 0;border-top:1px solid #E4E8EE;font-size:13px;line-height:19px;color:#12305C;"><a href="tel:{{PHONE_HREF}}" style="color:#12305C;text-decoration:underline;">{{PHONE}}</a></td>
          </tr>
          <tr>
            <td width="140" style="padding:12px 12px 12px 0;border-top:1px solid #E4E8EE;font-size:10px;line-height:15px;font-weight:bold;color:#8B93A3;letter-spacing:1px;text-transform:uppercase;vertical-align:top;">Attending as</td>
            <td style="padding:12px 0;border-top:1px solid #E4E8EE;font-size:13px;line-height:19px;color:#12305C;">{{REGISTERED_AS}}</td>
          </tr>
          <tr>
            <td width="140" style="padding:12px 12px 12px 0;border-top:1px solid #E4E8EE;font-size:10px;line-height:15px;font-weight:bold;color:#8B93A3;letter-spacing:1px;text-transform:uppercase;vertical-align:top;">City</td>
            <td style="padding:12px 0;border-top:1px solid #E4E8EE;font-size:13px;line-height:19px;color:#12305C;">{{CITY}}</td>
          </tr>
          <tr>
            <td width="140" style="padding:12px 12px 12px 0;border-top:1px solid #E4E8EE;font-size:10px;line-height:15px;font-weight:bold;color:#8B93A3;letter-spacing:1px;text-transform:uppercase;vertical-align:top;">{{ORG_LABEL}}</td>
            <td style="padding:12px 0;border-top:1px solid #E4E8EE;font-size:13px;line-height:19px;color:#12305C;">{{ORG_NAME}}</td>
          </tr>
          <tr>
            <td width="140" style="padding:12px 12px 12px 0;border-top:1px solid #E4E8EE;font-size:10px;line-height:15px;font-weight:bold;color:#8B93A3;letter-spacing:1px;text-transform:uppercase;vertical-align:top;">ID / Registration</td>
            <td style="padding:12px 0;border-top:1px solid #E4E8EE;font-size:13px;line-height:19px;color:#12305C;">{{ID_NUMBER}}</td>
          </tr>
          <tr>
            <td width="140" style="padding:12px 12px 12px 0;border-top:1px solid #E4E8EE;font-size:10px;line-height:15px;font-weight:bold;color:#8B93A3;letter-spacing:1px;text-transform:uppercase;vertical-align:top;">Designation</td>
            <td style="padding:12px 0;border-top:1px solid #E4E8EE;font-size:13px;line-height:19px;color:#12305C;">{{DESIGNATION}}</td>
          </tr>
          <tr>
            <td colspan="2" style="border-top:1px solid #E4E8EE;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

        </table>
      </td>
    </tr>

    <!-- Actions -->
    <tr>
      <td style="padding:20px 32px 0 32px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="background-color:#E87722;">
              <a href="mailto:{{EMAIL}}?subject=Tier-2%20Rising%20Startup%20Summit"
                 style="display:inline-block;padding:13px 22px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:bold;line-height:14px;letter-spacing:1px;text-transform:uppercase;color:#FFFFFF;text-decoration:none;">Reply to {{FIRST_NAME}}</a>
            </td>
            <td style="width:12px;">&nbsp;</td>
            <td style="border:1px solid #12305C;">
              <a href="tel:{{PHONE_HREF}}"
                 style="display:inline-block;padding:12px 26px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:bold;line-height:14px;letter-spacing:1px;text-transform:uppercase;color:#12305C;text-decoration:none;">Call</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Status note -->
    <tr>
      <td style="padding:20px 32px 26px 32px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:19px;color:#3F5B8A;">
        A registration confirmation has already gone out to <a href="mailto:{{EMAIL}}" style="color:#3F5B8A;text-decoration:underline;">{{EMAIL}}</a>. The row is in the registrations sheet with Status <strong style="color:#12305C;">{{STATUS}}</strong> &mdash; the free pass carries no charge.
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding:0 20px 20px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0B2544;">
          <tr>
            <td style="padding:24px;font-family:Arial,Helvetica,sans-serif;">
              <div style="font-size:12px;line-height:18px;font-weight:bold;color:#FFFFFF;letter-spacing:0.6px;">TIER-2 RISING STARTUP SUMMIT</div>
              <div style="font-size:11px;line-height:18px;color:#8FB0DA;padding-top:10px;">NammaOffice Presents &middot; In association with Startup Singam</div>
              <div style="font-size:11px;line-height:18px;color:#8FB0DA;">{{EVENT_LOCATION}} &middot; {{EVENT_DATES}}</div>
              <div style="border-top:1px solid #1D3D66;font-size:0;line-height:0;margin-top:16px;">&nbsp;</div>
              <div style="font-size:10px;line-height:16px;color:#5C7CA8;padding-top:14px;">Automated notification from free pass registrations on the summit website.</div>
              <div style="font-size:10px;line-height:16px;color:#5C7CA8;">Questions? Reply to this email or write to <a href="mailto:info@tier2rising.com" style="color:#E87722;text-decoration:none;font-weight:bold;">info@tier2rising.com</a>.</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

  </table>

</td>
</tr>
</table>
</body>
</html>`
