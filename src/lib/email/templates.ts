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
import { PAID_CONFIRMATION_HTML, PAID_SUBJECT, TEST_MODE_BANNER } from './paid'
import { ticketById } from '@/content/tickets'

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

/* ------------------------------------------------------------------ *
 * Paid registration — receipt + organiser notification + failure alert
 *
 * Used only when REGISTRATION_PAYMENT_ENABLED=1 and money was actually captured.
 * With payment off, the approved waitlist templates above are still what goes out.
 * ------------------------------------------------------------------ */

export type PaymentInfo = {
  paymentId: string
  orderId: string
  amountPaise: number
  /** Human-readable amount, formatted once by the payments layer. */
  amountLabel: string
  /** Which pass was bought, e.g. "Founder Programme". */
  ticketName: string
  /**
   * Catalogue id of the pass. A plain string, not TicketId, and deliberately so: this
   * arrives from a persisted journal row or from Razorpay's order notes, either of
   * which may name a pass that has since been renamed or retired. Typing it to the
   * current union would be asserting something about old data we cannot check.
   * accessLabel() treats an unknown id the same as a missing one.
   */
  ticketId?: string
  paidAt: Date
  method?: string
  /** rzp_test_… keys. Stamps a warning banner so a test receipt can't pass as real. */
  testMode: boolean
}

/**
 * What the bought pass actually admits you to — "Day 2", "Day 1 + Day 2" — read from
 * the ticket catalogue rather than written out here, so a receipt cannot contradict the
 * card that sold it.
 *
 * Falls back to the event dates when the id is missing or unknown. That is the honest
 * answer for a recovered order: the summit runs on those dates and we are not going to
 * invent an entitlement we cannot look up.
 */
export function accessLabel(pay: PaymentInfo): string {
  const ticket = pay.ticketId ? ticketById(pay.ticketId) : null
  return ticket?.meta.find((m) => m.label === 'Access')?.value || site.dates
}

/**
 * The receipt. Distinct from participantEmail() because that one tells the reader
 * ticketing hasn't opened yet — see the comment at the top of ./paid.
 */
export function paidParticipantEmail(
  r: Registration,
  pay: PaymentInfo,
): { subject: string; html: string; text: string } {
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
    AMOUNT: pay.amountLabel,
    TICKET: pay.ticketName,
    ACCESS: accessLabel(pay),
    PAID_ON: stamp(pay.paidAt),
    PAYMENT_ID: pay.paymentId,
    ORDER_ID: pay.orderId,
    CONTACT_EMAIL: site.contactEmail,
    CONTACT_PHONE: site.contactPhone,
    CONTACT_PHONE_HREF: site.contactPhone.replace(/[^\d+]/g, ''),
  }

  // The banner is trusted markup, so it is substituted before fillTokens rather than
  // through it — fillTokens escapes, which would print the tags as text.
  const withBanner = PAID_CONFIRMATION_HTML.replace(
    '{{TEST_BANNER}}',
    pay.testMode ? TEST_MODE_BANNER : '',
  )

  /*
   * Spread the test-mode line in rather than emitting '' for it.
   *
   * This array used to end `.filter((l) => l !== '')`, which was there to drop that one
   * entry in live mode — but it matched every OTHER '' too, and those are the blank
   * lines separating the paragraphs, the address block and the two tables. The
   * plain-text receipt arrived as a single unbroken wall. Nothing in the HTML part
   * changed, so it only showed up for readers whose client prefers text/plain.
   */
  const text = [
    ...(pay.testMode ? ['TEST MODE — no real money was charged. Not a valid receipt.', ''] : []),
    `THANKS, ${firstName(r.name).toUpperCase()}. YOUR SEAT IS CONFIRMED.`,
    '',
    `We've received your payment of ${pay.amountLabel} for the ${pay.ticketName} and your`,
    "place at the summit is booked. Keep this email — it's your receipt.",
    '',
    'Erode is where investors, government scheme officers and bank credit heads come',
    'to Tier-2, instead of the other way round.',
    '',
    `Your ${pay.ticketName} admits you on ${accessLabel(pay)}.`,
    '',
    site.dates,
    `${site.venue}, ${site.city}`,
    '',
    'PAYMENT RECEIPT',
    `Ticket         ${pay.ticketName}`,
    `Access         ${accessLabel(pay)}`,
    `Amount paid    ${pay.amountLabel}`,
    `Paid on        ${stamp(pay.paidAt)}`,
    `Payment ID     ${pay.paymentId}`,
    `Order ID       ${pay.orderId}`,
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
    `${site.contactEmail} · ${site.contactPhone}`,
  ].join('\n')

  return {
    subject: fillTokens(PAID_SUBJECT, tokens, { escape: false }),
    text,
    html: fillTokens(withBanner, tokens),
  }
}

/** Organiser copy for a paid registration — the same layout plus the money. */
export function paidOrganiserEmail(
  r: Registration,
  pay: PaymentInfo,
  at = new Date(),
): { subject: string; html: string; text: string } {
  const subject = `Paid registration — ${r.name} · ${pay.ticketName} · ${pay.amountLabel}`
  const when = stamp(at)

  const body = `
          <tr>
            <td style="background-color:${C.white};padding:40px 36px 0 36px;font-family:${FONT};">
              <div style="font-size:11px;font-weight:700;letter-spacing:0.16em;color:${C.orange};text-transform:uppercase;">Paid registration${
                pay.testMode ? ' · test mode' : ''
              }</div>
              <h1 style="margin:12px 0 0 0;font-size:28px;line-height:1.15;font-weight:700;letter-spacing:-0.01em;color:${
                C.navy
              };">${esc(r.name)}</h1>
              <div style="font-size:13px;color:${C.muted};padding-top:8px;">Paid ${esc(when)}</div>
            </td>
          </tr>

          <tr>
            <td style="background-color:${C.white};padding:26px 36px 0 36px;font-family:${FONT};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${
                C.hairline
              };">
${detailRow('Ticket', pay.ticketName)}
${detailRow('Amount', pay.amountLabel)}
${detailRow('Payment ID', pay.paymentId)}
${detailRow('Order ID', pay.orderId)}
${detailRow('Method', pay.method || '—')}
${detailRow('Name', r.name)}
${detailRow('Email', r.email, { href: `mailto:${r.email}` })}
${detailRow('Phone', r.phone, { href: `tel:${r.phone.replace(/[^\d+]/g, '')}` })}
${detailRow('Sector', r.sector)}
${detailRow('Registered as', r.registerAs)}
${detailRow('City', r.city, { last: true })}
              </table>
            </td>
          </tr>

          <tr>
            <td style="background-color:${C.white};padding:28px 36px 40px 36px;">
${button('Reply to ' + firstName(r.name), `mailto:${r.email}?subject=${encodeURIComponent(
    'Re: your ' + site.name + ' registration',
  )}`)}
              <p style="margin:22px 0 0 0;font-family:${FONT};font-size:13px;line-height:1.6;color:${C.muted};">
                Payment captured and the receipt has gone to ${esc(r.email)}. This entry is also appended to the
                registrations sheet.
              </p>
            </td>
          </tr>
`

  const text = [
    `PAID REGISTRATION${pay.testMode ? ' (TEST MODE)' : ''}`,
    '',
    r.name,
    `Paid ${when}`,
    '',
    `Ticket         ${pay.ticketName}`,
    `Amount         ${pay.amountLabel}`,
    `Payment ID     ${pay.paymentId}`,
    `Order ID       ${pay.orderId}`,
    `Method         ${pay.method || '—'}`,
    `Name           ${r.name}`,
    `Email          ${r.email}`,
    `Phone          ${r.phone}`,
    `Sector         ${r.sector}`,
    `Registered as  ${r.registerAs}`,
    `City           ${r.city}`,
    '',
    `The receipt has gone to ${r.email}.`,
    '',
    '—',
    `${site.fullName}`,
  ].join('\n')

  return {
    subject,
    text,
    html: shell({
      preheader: `${pay.ticketName} · ${pay.amountLabel} · ${r.name} · ${r.city}`,
      body,
      footerNote: 'Automated notification from the registration form on the summit website.',
    }),
  }
}

/**
 * THE ALERT THAT MATTERS.
 *
 * Sent when money has been captured but the registration could not be recorded after
 * every retry. It is the only email in this file that asks a human to do something,
 * so it is written to be actionable at a glance on a phone: what happened, whose money
 * it is, the exact ids to search, and the two fields needed to re-enter the row by
 * hand. No branding, no CTA — this is an operational page, not marketing.
 */
export function unfulfilledAlertEmail(
  r: Registration,
  pay: PaymentInfo,
  reason: string,
): { subject: string; html: string; text: string } {
  const subject = `ACTION REQUIRED — paid but NOT recorded: ${r.name} (${pay.amountLabel})`
  const rows: [string, string][] = [
    ['Ticket', pay.ticketName],
    ['Amount captured', pay.amountLabel],
    ['Payment ID', pay.paymentId],
    ['Order ID', pay.orderId],
    ['Paid at', stamp(pay.paidAt)],
    ['Mode', pay.testMode ? 'TEST' : 'LIVE'],
    ['Name', r.name],
    ['Email', r.email],
    ['Phone', r.phone],
    ['Sector', r.sector],
    ['Registered as', r.registerAs],
    ['City', r.city],
    ['Failure', reason],
  ]

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FFF5F5;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FFF5F5;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background:#FFFFFF;font-family:${FONT};">
  <tr><td style="background:#B3261E;padding:20px 28px;">
    <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;color:#FFD9D6;">ACTION REQUIRED</div>
    <div style="font-size:21px;font-weight:700;color:#FFFFFF;padding-top:6px;">Payment captured, registration NOT recorded</div>
  </td></tr>
  <tr><td style="padding:24px 28px 0 28px;font-size:15px;line-height:1.6;color:#3D4A5C;">
    A customer has been charged ${esc(pay.amountLabel)} but the registration could not be written to the
    sheet after repeated attempts. <strong>Their money is with us and their seat is not booked.</strong>
    Add the row by hand using the details below, then reply to the customer directly.
  </td></tr>
  <tr><td style="padding:20px 28px 0 28px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${
      C.hairline
    };">
${rows
  .map(
    ([k, v], i) =>
      `      <tr><td width="150" style="padding:7px 0;font-size:13px;color:${C.muted};border-bottom:${
        i === rows.length - 1 ? 'none' : `1px solid ${C.hairline}`
      };">${esc(k)}</td><td style="padding:7px 0;font-size:13px;color:${
        C.ink
      };border-bottom:${
        i === rows.length - 1 ? 'none' : `1px solid ${C.hairline}`
      };">${esc(v)}</td></tr>`,
  )
  .join('\n')}
    </table>
  </td></tr>
  <tr><td style="padding:22px 28px 28px 28px;font-size:13px;line-height:1.6;color:${C.muted};">
    Look the payment up in the Razorpay dashboard by Payment ID. The full registration is also stored on the
    order's <em>notes</em> field, so nothing is lost even if this email is.
  </td></tr>
</table></td></tr></table></body></html>`

  const text = [
    'ACTION REQUIRED — PAYMENT CAPTURED, REGISTRATION NOT RECORDED',
    '',
    `A customer has been charged ${pay.amountLabel} but the registration could not be`,
    'written to the sheet. Their money is with us and their seat is not booked.',
    'Add the row by hand using the details below.',
    '',
    ...rows.map(([k, v]) => `${k.padEnd(17)}${v}`),
    '',
    "The full registration is also stored on the Razorpay order's notes field.",
  ].join('\n')

  return { subject, html, text }
}
