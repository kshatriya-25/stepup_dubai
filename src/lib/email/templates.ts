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

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tier2rising.com'

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

/** A numbered "what happens next" step with an orange square numeral. */
function step(n: number, title: string, copy: string): string {
  return `
                <tr>
                  <td width="34" valign="top" style="padding:0 14px 18px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr><td width="28" height="28" align="center" valign="middle" style="width:28px;height:28px;background-color:${C.orange};font-family:${FONT};font-size:13px;font-weight:700;color:${C.onOrange};">${n}</td></tr>
                    </table>
                  </td>
                  <td valign="top" style="padding:0 0 18px 0;font-family:${FONT};">
                    <div style="font-size:14px;font-weight:700;color:${C.ink};letter-spacing:0.01em;">${esc(title)}</div>
                    <div style="font-size:14px;line-height:1.6;color:${C.muted};padding-top:3px;">${esc(copy)}</div>
                  </td>
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
  const subject = `You're on the list — ${site.fullName}, ${site.dates}`

  const body = `
          <!-- Hero -->
          <tr>
            <td style="background-color:${C.white};padding:44px 36px 8px 36px;font-family:${FONT};">
              <div style="font-size:11px;font-weight:700;letter-spacing:0.16em;color:${C.orange};text-transform:uppercase;">Registration confirmed</div>
              <h1 style="margin:14px 0 0 0;font-size:32px;line-height:1.1;font-weight:700;letter-spacing:-0.01em;color:${
                C.navy
              };text-transform:uppercase;">You&rsquo;re on the<br>list, ${esc(firstName(r.name))}.</h1>
              <p style="margin:18px 0 0 0;font-size:16px;line-height:1.65;color:${C.muted};">
                Your registration for the <strong style="color:${C.ink};">${esc(
                  site.fullName
                )}</strong> is in. The moment tickets open, you hear from us first &mdash; before it goes public.
              </p>
            </td>
          </tr>

          <!-- Event card -->
          <tr>
            <td style="background-color:${C.white};padding:28px 36px 0 36px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${
                C.foam
              };border-left:4px solid ${C.orange};">
                <tr>
                  <td style="padding:22px 24px;font-family:${FONT};">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding-bottom:18px;">
                          <div style="font-size:10px;font-weight:700;letter-spacing:0.14em;color:${
                            C.muted
                          };text-transform:uppercase;">When</div>
                          <div style="font-size:17px;font-weight:700;color:${C.navy};padding-top:4px;">${esc(
                            site.dates
                          )}</div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom:18px;">
                          <div style="font-size:10px;font-weight:700;letter-spacing:0.14em;color:${
                            C.muted
                          };text-transform:uppercase;">Where</div>
                          <div style="font-size:17px;font-weight:700;color:${C.navy};padding-top:4px;">${esc(
                            site.venue
                          )}, ${esc(site.city)}</div>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div style="font-size:10px;font-weight:700;letter-spacing:0.14em;color:${
                            C.muted
                          };text-transform:uppercase;">Entry</div>
                          <div style="font-size:15px;font-weight:600;color:${C.navy};padding-top:4px;">${esc(
                            site.entry
                          )}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- What happens next -->
          <tr>
            <td style="background-color:${C.white};padding:36px 36px 0 36px;font-family:${FONT};">
              <div style="font-size:11px;font-weight:700;letter-spacing:0.16em;color:${
                C.navy
              };text-transform:uppercase;padding-bottom:20px;">What happens next</div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${step(1, 'You get first access', 'When ticketing opens, your link arrives before the public announcement.')}
${step(2, 'The programme lands here', 'Agenda, speakers and the Top 10 startup shortlist, straight to this inbox.')}
${step(3, 'We see you in Erode', `${site.dates} at ${site.venue}. Block the dates now.`)}
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="background-color:${C.white};padding:14px 36px 36px 36px;">
${button('Explore the summit', siteUrl)}
            </td>
          </tr>

          <!-- Their details -->
          <tr>
            <td style="background-color:${C.white};padding:0 36px 40px 36px;font-family:${FONT};">
              <div style="height:1px;line-height:1px;font-size:0;background-color:${
                C.hairline
              };margin-bottom:24px;">&nbsp;</div>
              <div style="font-size:11px;font-weight:700;letter-spacing:0.16em;color:${
                C.navy
              };text-transform:uppercase;">What you registered with</div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="padding-top:6px;">
${detailRow('Name', r.name)}
${detailRow('Email', r.email)}
${detailRow('Phone', r.phone)}
${detailRow('Sector', r.sector)}
${detailRow('Registered as', r.registerAs)}
${detailRow('City', r.city, { last: true })}
              </table>
              <p style="margin:18px 0 0 0;font-size:13px;line-height:1.6;color:${C.muted};">
                Spotted a mistake? Just reply to this email and we&rsquo;ll fix it.
              </p>
            </td>
          </tr>
`

  const text = [
    `YOU'RE ON THE LIST, ${firstName(r.name).toUpperCase()}.`,
    '',
    `Your registration for the ${site.fullName} is in. The moment tickets open,`,
    `you hear from us first — before it goes public.`,
    '',
    `WHEN   ${site.dates}`,
    `WHERE  ${site.venue}, ${site.city}`,
    `ENTRY  ${site.entry}`,
    '',
    'WHAT HAPPENS NEXT',
    '1. You get first access — your ticket link arrives before the public announcement.',
    '2. The programme lands here — agenda, speakers and the Top 10 startup shortlist.',
    `3. We see you in Erode — ${site.dates} at ${site.venue}.`,
    '',
    `Explore the summit: ${siteUrl}`,
    '',
    'WHAT YOU REGISTERED WITH',
    `Name           ${r.name}`,
    `Email          ${r.email}`,
    `Phone          ${r.phone}`,
    `Sector         ${r.sector}`,
    `Registered as  ${r.registerAs}`,
    `City           ${r.city}`,
    '',
    "Spotted a mistake? Just reply to this email and we'll fix it.",
    '',
    '—',
    `${site.fullName}`,
    `${site.initiativeBy} · ${site.season}`,
    `${site.venue}, ${site.city} · ${site.dates}`,
    `${organiserContact}`,
  ].join('\n')

  return {
    subject,
    text,
    html: shell({
      preheader: `Your place is registered — ${site.dates}, ${site.venue}, ${site.city.split(',')[0]}.`,
      body,
      footerNote: 'You received this because you registered for ticket updates on our website.',
    }),
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
  const subject = `We've got your partnership enquiry — ${site.fullName}`

  const body = `
          <!-- Hero -->
          <tr>
            <td style="background-color:${C.white};padding:44px 36px 8px 36px;font-family:${FONT};">
              <div style="font-size:11px;font-weight:700;letter-spacing:0.16em;color:${C.orange};text-transform:uppercase;">Partnership enquiry received</div>
              <h1 style="margin:14px 0 0 0;font-size:32px;line-height:1.1;font-weight:700;letter-spacing:-0.01em;color:${
                C.navy
              };text-transform:uppercase;">Thank you,<br>${esc(firstName(p.name))}.</h1>
              <p style="margin:18px 0 0 0;font-size:16px;line-height:1.65;color:${C.muted};">
                We&rsquo;ve received your enquiry on behalf of <strong style="color:${C.ink};">${esc(
                  p.businessName
                )}</strong>. Someone from the ${esc(
                  site.name
                )} team will be in touch shortly to talk through sponsorship, speaking slots and desk options.
              </p>
            </td>
          </tr>

          <!-- Event card -->
          <tr>
            <td style="background-color:${C.white};padding:28px 36px 0 36px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${
                C.foam
              };border-left:4px solid ${C.orange};">
                <tr>
                  <td style="padding:22px 24px;font-family:${FONT};">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding-bottom:18px;">
                          <div style="font-size:10px;font-weight:700;letter-spacing:0.14em;color:${
                            C.muted
                          };text-transform:uppercase;">When</div>
                          <div style="font-size:17px;font-weight:700;color:${C.navy};padding-top:4px;">${esc(
                            site.dates
                          )}</div>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div style="font-size:10px;font-weight:700;letter-spacing:0.14em;color:${
                            C.muted
                          };text-transform:uppercase;">Where</div>
                          <div style="font-size:17px;font-weight:700;color:${C.navy};padding-top:4px;">${esc(
                            site.venue
                          )}, ${esc(site.city)}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- What happens next -->
          <tr>
            <td style="background-color:${C.white};padding:36px 36px 0 36px;font-family:${FONT};">
              <div style="font-size:11px;font-weight:700;letter-spacing:0.16em;color:${
                C.navy
              };text-transform:uppercase;padding-bottom:20px;">What happens next</div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${step(1, 'We read it properly', 'Your enquiry goes straight to the organising team, not a queue.')}
${step(2, 'We call you', 'To understand what you want out of the summit before proposing anything.')}
${step(3, 'You get the options', 'Sponsorship tiers, speaking slots and desk formats, with what each includes.')}
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="background-color:${C.white};padding:14px 36px 36px 36px;">
${button('Explore the summit', siteUrl)}
            </td>
          </tr>

          <!-- Their details -->
          <tr>
            <td style="background-color:${C.white};padding:0 36px 40px 36px;font-family:${FONT};">
              <div style="height:1px;line-height:1px;font-size:0;background-color:${
                C.hairline
              };margin-bottom:24px;">&nbsp;</div>
              <div style="font-size:11px;font-weight:700;letter-spacing:0.16em;color:${
                C.navy
              };text-transform:uppercase;">What you sent us</div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="padding-top:6px;">
${detailRow('Name', p.name)}
${detailRow('Business', p.businessName)}
${detailRow('Email', p.email)}
${detailRow('Phone', p.phone, { last: true })}
              </table>
              <p style="margin:18px 0 0 0;font-size:13px;line-height:1.6;color:${C.muted};">
                Spotted a mistake? Just reply to this email and we&rsquo;ll fix it.
              </p>
            </td>
          </tr>
`

  const text = [
    `THANK YOU, ${firstName(p.name).toUpperCase()}.`,
    '',
    `We've received your enquiry on behalf of ${p.businessName}. Someone from the`,
    `${site.name} team will be in touch shortly to talk through sponsorship,`,
    'speaking slots and desk options.',
    '',
    `WHEN   ${site.dates}`,
    `WHERE  ${site.venue}, ${site.city}`,
    '',
    'WHAT HAPPENS NEXT',
    '1. We read it properly — your enquiry goes straight to the organising team.',
    '2. We call you — to understand what you want out of the summit.',
    '3. You get the options — sponsorship tiers, speaking slots and desk formats.',
    '',
    `Explore the summit: ${siteUrl}`,
    '',
    'WHAT YOU SENT US',
    `Name      ${p.name}`,
    `Business  ${p.businessName}`,
    `Email     ${p.email}`,
    `Phone     ${p.phone}`,
    '',
    "Spotted a mistake? Just reply to this email and we'll fix it.",
    '',
    '—',
    `${site.fullName}`,
    `${site.initiativeBy} · ${site.season}`,
    `${site.venue}, ${site.city} · ${site.dates}`,
    `${organiserContact}`,
  ].join('\n')

  return {
    subject,
    text,
    html: shell({
      preheader: `We'll be in touch about partnering with the ${site.fullName}.`,
      body,
      footerNote: 'You received this because you enquired about partnering with us on our website.',
    }),
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
