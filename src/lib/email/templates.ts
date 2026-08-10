/**
 * Registration email templates — participant confirmation + organiser notification.
 *
 * These are EMAIL templates, not web pages. The rules are different and deliberate:
 *   - Table layout only. No flexbox, no grid, no float — Outlook renders none of them.
 *   - Every style is inline. <style> blocks are stripped by Gmail's clipper and others.
 *   - No external images. Most clients block remote images by default, so the design
 *     must be complete with images off — the wordmark is type, not a logo file.
 *   - Explicit background-color on every cell, so dark-mode auto-inversion has less
 *     room to mangle the palette.
 *   - 600px max width — the safe width across Outlook's rendering surface.
 *
 * Palette is lifted from tailwind.config.ts so the mail matches the site exactly.
 */

import { site } from '@/content/site'
import {
  REGISTRANT_CONFIRMATION_HTML,
  REGISTRANT_SUBJECT,
  PARTNER_CONFIRMATION_HTML,
  PARTNER_SUBJECT,
} from './approved'

const C = {
  navy: '#072B5F',
  navy2: '#0A3A72',
  night: '#04162E',
  orange: '#F47B20',
  onOrange: '#072B5F', // navy on orange — white fails contrast against #F47B20
  white: '#FFFFFF',
  foam: '#F4F6FA',
  ink: '#0B2447',
  muted: '#5A6B82',
  hairline: '#E3E8F0',
}

const FONT = "'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,'Helvetica Neue',Arial,sans-serif"

export type Registration = {
  name: string
  email: string
  phone: string
  sector: string
  /** Company | Government | Public | Student */
  registerAs: string
  city: string
}

/** HTML-escape every interpolated value. Registrations are untrusted input. */
function esc(value: string): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** "Ankit Rajput" -> "Ankit". Falls back to the whole string. */
function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name.trim()
}

/**
 * Substitute {{TOKEN}} placeholders in the approved markup.
 *
 * Values are HTML-escaped by default because they are untrusted form input — a name
 * containing `<` would otherwise break the layout or inject markup. Subject lines pass
 * `escape: false`, since a mail header is not HTML and would show a literal `&#39;`.
 *
 * An unrecognised token resolves to '' and logs rather than throwing: a template typo
 * should leave a gap in one email, not take down the endpoint that captures the lead.
 */
function fillTokens(
  template: string,
  values: Record<string, string>,
  opts: { escape?: boolean } = {},
): string {
  const escape = opts.escape !== false
  return template.replace(/\{\{([A-Z_]+)\}\}/g, (_match, key: string) => {
    if (!(key in values)) {
      console.warn(`[email] unknown template token {{${key}}} — rendered empty`)
      return ''
    }
    return escape ? esc(values[key]) : values[key]
  })
}

/** Submission time, always rendered in IST — the organiser reads these in Erode. */
export function stamp(date = new Date()): string {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(date) + ' IST'
}

/**
 * The shared chrome: preheader, orange hairline, navy masthead, body slot, footer.
 * Both emails use it so they read as one system; only the body differs.
 */
function shell(opts: { preheader: string; body: string; footerNote: string }): string {
  return `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${esc(site.fullName)}</title>
</head>
<body style="margin:0;padding:0;width:100%;background-color:${C.foam};">
  <!-- Preheader: the grey preview line next to the subject in most inboxes. -->
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${esc(
    opts.preheader
  )}</div>
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.foam};">
    <tr>
      <td align="center" style="padding:32px 16px;">

        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background-color:${C.white};">

          <!-- Orange signature rule -->
          <tr><td style="height:5px;line-height:5px;font-size:0;background-color:${C.orange};">&nbsp;</td></tr>

          <!-- Masthead -->
          <tr>
            <td style="background-color:${C.navy};padding:28px 36px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left" style="font-family:${FONT};">
                    <div style="font-size:21px;font-weight:700;letter-spacing:0.06em;color:${C.white};text-transform:uppercase;line-height:1.1;">Tier-2 Rising</div>
                    <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;color:${C.orange};text-transform:uppercase;padding-top:6px;">Startup Summit</div>
                  </td>
                  <td align="right" style="font-family:${FONT};font-size:11px;font-weight:600;letter-spacing:0.1em;color:#9DB2D4;text-transform:uppercase;white-space:nowrap;">
                    ${esc(site.dates.replace('October', 'Oct'))}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

${opts.body}

          <!-- Footer -->
          <tr>
            <td style="background-color:${C.night};padding:30px 36px;font-family:${FONT};">
              <div style="font-size:13px;font-weight:700;letter-spacing:0.06em;color:${C.white};text-transform:uppercase;">${esc(
                site.fullName
              )}</div>
              <div style="font-size:12px;line-height:1.7;color:#8FA6C9;padding-top:8px;">
                ${esc(site.initiativeBy)} &middot; ${esc(site.season)}<br>
                ${esc(site.venue)}, ${esc(site.city)} &middot; ${esc(site.dates)}
              </div>
              <div style="height:1px;line-height:1px;font-size:0;background-color:#1B3A66;margin:20px 0;">&nbsp;</div>
              <div style="font-size:11px;line-height:1.7;color:#6E86AB;">
                ${opts.footerNote}<br>
                Questions? Reply to this email or write to
                <a href="mailto:${esc(organiserContact)}" style="color:${C.orange};text-decoration:none;">${esc(
                  organiserContact
                )}</a>.
              </div>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>`
}

/** The address shown to readers as the way to reach a human. */
const organiserContact = process.env.MAIL_REPLY_TO || process.env.MAIL_FROM || 'info@tier2rising.com'

/** A label/value row inside the details table. */
function detailRow(label: string, value: string, opts: { last?: boolean; href?: string } = {}): string {
  const inner = opts.href
    ? `<a href="${esc(opts.href)}" style="color:${C.navy};text-decoration:none;border-bottom:1px solid ${
        C.orange
      };">${esc(value)}</a>`
    : esc(value)
  const border = opts.last ? '' : `border-bottom:1px solid ${C.hairline};`
  return `
                <tr>
                  <td width="34%" style="${border}padding:13px 0;font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:0.12em;color:${C.muted};text-transform:uppercase;vertical-align:top;">${esc(
                    label
                  )}</td>
                  <td style="${border}padding:13px 0;font-family:${FONT};font-size:15px;color:${
                    C.ink
                  };vertical-align:top;">${inner}</td>
                </tr>`
}

/** Bulletproof-ish CTA. Table-based so Outlook renders the fill, not just the text. */
function button(label: string, href: string): string {
  return `
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" bgcolor="${C.orange}" style="background-color:${C.orange};">
                    <a href="${esc(href)}" style="display:inline-block;padding:15px 32px;font-family:${FONT};font-size:13px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${
                      C.onOrange
                    };text-decoration:none;">${esc(label)}</a>
                  </td>
                </tr>
              </table>`
}

/* ------------------------------------------------------------------ *
 * Participant confirmation
 * ------------------------------------------------------------------ */

export function participantEmail(r: Registration): { subject: string; html: string; text: string } {
  const tokens = {
    FIRST_NAME: firstName(r.name),
    NAME: r.name,
    EMAIL: r.email,
    PHONE: r.phone,
    SECTOR: r.sector,
    REGISTERED_AS: r.registerAs,
    CITY: r.city,
    EVENT_DATES: site.dates,
    EVENT_LOCATION: `${site.venue}, ${site.city}`,
  }

  const text = [
    `THANKS, ${firstName(r.name).toUpperCase()}. YOU'RE ON THE WAITLIST.`,
    '',
    "Your details are in, and you're on the event waitlist. The summit is a paid",
    "ticket event, and ticketing isn't live yet — early-bird registration and the",
    'payment link are being set up now.',
    '',
    "You'll be notified the moment the early-bird link opens. Waitlist entries get",
    'first access, along with the pricing and the agenda.',
    '',
    site.dates,
    `${site.venue}, ${site.city}`,
    '',
    'Explore the summit: https://tier2rising.com/',
    '',
    'YOUR DETAILS',
    `Name           ${r.name}`,
    `Email          ${r.email}`,
    `Phone          ${r.phone}`,
    `Sector         ${r.sector}`,
    `Registered as  ${r.registerAs}`,
    `City           ${r.city}`,
    '',
    'See you in Erode.',
    'Team Tier-2 Rising · NammaOffice',
    '',
    '—',
    'TIER-2 RISING STARTUP SUMMIT',
    'NammaOffice Presents · In association with Startup Singam',
    'info@tier2rising.com · +91 90921 09213',
  ].join('\n')

  return {
    subject: fillTokens(REGISTRANT_SUBJECT, tokens, { escape: false }),
    text,
    html: fillTokens(REGISTRANT_CONFIRMATION_HTML, tokens),
  }
}

/* ------------------------------------------------------------------ *
 * Organiser notification
 * ------------------------------------------------------------------ */

export function organiserEmail(r: Registration, at = new Date()): {
  subject: string
  html: string
  text: string
} {
  const subject = `New registration — ${r.name} · ${r.sector} · ${r.city}`
  const when = stamp(at)

  const body = `
          <!-- Hero -->
          <tr>
            <td style="background-color:${C.white};padding:40px 36px 0 36px;font-family:${FONT};">
              <div style="font-size:11px;font-weight:700;letter-spacing:0.16em;color:${C.orange};text-transform:uppercase;">New registration</div>
              <h1 style="margin:12px 0 0 0;font-size:28px;line-height:1.15;font-weight:700;letter-spacing:-0.01em;color:${
                C.navy
              };">${esc(r.name)}</h1>
              <div style="font-size:13px;color:${C.muted};padding-top:8px;">Submitted ${esc(when)}</div>
            </td>
          </tr>

          <!-- Details -->
          <tr>
            <td style="background-color:${C.white};padding:26px 36px 0 36px;font-family:${FONT};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${
                C.hairline
              };">
${detailRow('Name', r.name)}
${detailRow('Email', r.email, { href: `mailto:${r.email}` })}
${detailRow('Phone', r.phone, { href: `tel:${r.phone.replace(/[^\d+]/g, '')}` })}
${detailRow('Sector', r.sector)}
${detailRow('Registered as', r.registerAs)}
${detailRow('City', r.city, { last: true })}
              </table>
            </td>
          </tr>

          <!-- Actions -->
          <tr>
            <td style="background-color:${C.white};padding:28px 36px 40px 36px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-right:10px;">
${button('Reply to ' + firstName(r.name), `mailto:${r.email}?subject=${encodeURIComponent(
    'Re: your ' + site.name + ' registration'
  )}`)}
                  </td>
                  <td>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="border:1px solid ${C.navy};">
                          <a href="tel:${esc(r.phone.replace(/[^\d+]/g, ''))}" style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:13px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${
                            C.navy
                          };text-decoration:none;">Call</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="margin:22px 0 0 0;font-family:${FONT};font-size:13px;line-height:1.6;color:${C.muted};">
                A confirmation has already gone out to ${esc(r.email)}. This entry is also appended to the
                registrations sheet.
              </p>
            </td>
          </tr>
`

  const text = [
    'NEW REGISTRATION',
    '',
    r.name,
    `Submitted ${when}`,
    '',
    `Name           ${r.name}`,
    `Email          ${r.email}`,
    `Phone          ${r.phone}`,
    `Sector         ${r.sector}`,
    `Registered as  ${r.registerAs}`,
    `City           ${r.city}`,
    '',
    `A confirmation has already gone out to ${r.email}.`,
    'This entry is also appended to the registrations sheet.',
    '',
    '—',
    `${site.fullName}`,
  ].join('\n')

  return {
    subject,
    text,
    html: shell({
      preheader: `${r.name} · ${r.sector} · ${r.city} · ${r.email}`,
      body,
      footerNote: 'Automated notification from the registration form on the summit website.',
    }),
  }
}

/* ------------------------------------------------------------------ *
 * Partner enquiries — "Partner with us" in the Participate modal
 *
 * Same chrome as the registration mail on purpose: one visual system, one place to
 * change the branding. Only the copy differs, because a prospective sponsor asking
 * about a desk should not be told "You're on the list" about tickets.
 * ------------------------------------------------------------------ */

export type PartnerEnquiry = {
  name: string
  businessName: string
  email: string
  phone: string
}

export function partnerEnquiryEmail(p: PartnerEnquiry): {
  subject: string
  html: string
  text: string
} {
  const tokens = {
    CONTACT_FIRST_NAME: firstName(p.name),
    CONTACT_NAME: p.name,
    COMPANY_NAME: p.businessName,
    EMAIL: p.email,
    PHONE: p.phone,
    EVENT_DATES: site.dates,
    EVENT_LOCATION: `${site.venue}, ${site.city}`,
  }

  const text = [
    `THANKS, ${firstName(p.name).toUpperCase()}. WE'VE GOT YOUR ENQUIRY.`,
    '',
    `Your partnership enquiry for ${p.businessName} with the Tier-2 Rising organising`,
    'committee. Someone from the team will get back to you shortly.',
    '',
    site.dates,
    `${site.venue}, ${site.city}`,
    '',
    'WHAT YOU SENT',
    `Company  ${p.businessName}`,
    `Contact  ${p.name}`,
    `Email    ${p.email}`,
    `Phone    ${p.phone}`,
    '',
    'Thanks for looking at Erode.',
    'Team Tier-2 Rising · NammaOffice',
    '',
    '—',
    'TIER-2 RISING STARTUP SUMMIT',
    'NammaOffice Presents · In association with Startup Singam',
    'info@tier2rising.com · +91 90921 09213',
  ].join('\n')

  return {
    subject: fillTokens(PARTNER_SUBJECT, tokens, { escape: false }),
    text,
    html: fillTokens(PARTNER_CONFIRMATION_HTML, tokens),
  }
}

export function partnerOrganiserEmail(p: PartnerEnquiry, at = new Date()): {
  subject: string
  html: string
  text: string
} {
  // Deliberately distinct from the attendee subject ("New registration — …") so the
  // two are filterable and never confused in the inbox.
  const subject = `New Partner registration — ${p.businessName}`
  const when = stamp(at)

  const body = `
          <!-- Hero -->
          <tr>
            <td style="background-color:${C.white};padding:40px 36px 0 36px;font-family:${FONT};">
              <div style="font-size:11px;font-weight:700;letter-spacing:0.16em;color:${C.orange};text-transform:uppercase;">New partner enquiry</div>
              <h1 style="margin:12px 0 0 0;font-size:28px;line-height:1.15;font-weight:700;letter-spacing:-0.01em;color:${
                C.navy
              };">${esc(p.businessName)}</h1>
              <div style="font-size:13px;color:${C.muted};padding-top:8px;">Submitted ${esc(when)}</div>
            </td>
          </tr>

          <!-- Details -->
          <tr>
            <td style="background-color:${C.white};padding:26px 36px 0 36px;font-family:${FONT};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${
                C.hairline
              };">
${detailRow('Business', p.businessName)}
${detailRow('Contact', p.name)}
${detailRow('Email', p.email, { href: `mailto:${p.email}` })}
${detailRow('Phone', p.phone, { href: `tel:${p.phone.replace(/[^\d+]/g, '')}`, last: true })}
              </table>
            </td>
          </tr>

          <!-- Actions -->
          <tr>
            <td style="background-color:${C.white};padding:28px 36px 40px 36px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-right:10px;">
${button('Reply to ' + firstName(p.name), `mailto:${p.email}?subject=${encodeURIComponent(
    'Re: partnering with ' + site.name
  )}`)}
                  </td>
                  <td>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="border:1px solid ${C.navy};">
                          <a href="tel:${esc(p.phone.replace(/[^\d+]/g, ''))}" style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:13px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${
                            C.navy
                          };text-decoration:none;">Call</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="margin:22px 0 0 0;font-family:${FONT};font-size:13px;line-height:1.6;color:${C.muted};">
                An acknowledgement has already gone out to ${esc(p.email)}. This enquiry is also appended to the
                <strong>Partners</strong> tab of the registrations sheet.
              </p>
            </td>
          </tr>
`

  const text = [
    'NEW PARTNER ENQUIRY',
    '',
    p.businessName,
    `Submitted ${when}`,
    '',
    `Business  ${p.businessName}`,
    `Contact   ${p.name}`,
    `Email     ${p.email}`,
    `Phone     ${p.phone}`,
    '',
    `An acknowledgement has already gone out to ${p.email}.`,
    'This enquiry is also appended to the Partners tab of the registrations sheet.',
    '',
    '—',
    `${site.fullName}`,
  ].join('\n')

  return {
    subject,
    text,
    html: shell({
      preheader: `${p.businessName} · ${p.name} · ${p.email}`,
      body,
      footerNote: 'Automated notification from the Participate form on the summit website.',
    }),
  }
}
