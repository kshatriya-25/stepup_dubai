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
  FREE_PASS_CONFIRMATION_HTML,
  FREE_PASS_SUBJECT,
  FREE_PASS_ALERT_HTML,
  FREE_PASS_ALERT_SUBJECT,
} from './approved'
import {
  PAID_CONFIRMATION_HTML,
  PAID_SUBJECT,
  caveatBanner,
  caveatLine,
  CAVEAT_LABEL,
  type ReceiptCaveat,
} from './paid'
import {
  ticketAccess,
  ticketById,
  isFreePass,
  idTypeOptions,
  interestOptions,
  coFounderSummary,
  teamSize,
  FREE_PASS_STATUS,
  categories,
  workshopOptions,
  meetingTypeOptions,
  stageOptions,
  type Ticket,
  type CategoryId,
} from '@/content/tickets'

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

/**
 * What the emails are allowed to see.
 *
 * Deliberately NOT the journal's Registration type. That one is a persistence record and
 * carries `updates`, `consent`, `ticketId` and other bookkeeping an email has no business
 * rendering; this one is the view. fulfil.ts maps between them in forEmail(), which is
 * the single place to look when a field reaches the sheet but not the receipt.
 *
 * Everything below `city` is optional because it depends on the pass and the category —
 * a Delegate Pass has no startup, and only a public attendee has an idType. passDetailRows
 * renders only what is present rather than printing empty labels.
 */
export type Registration = {
  name: string
  email: string
  phone: string
  city: string
  /** Human label of the category, e.g. "TBI Member". */
  registerAs: string
  /** Raw category id, used to pick the right word for the organisation label. */
  category?: string
  /** Industry — asked only on the Investor Pitch Pass. */
  sector: string

  orgName?: string
  idNumber?: string
  designation?: string
  /** Which government ID the number above belongs to. Public only. */
  idType?: string
  /** Why a member of the public is coming. Public only. */
  interest?: string

  workshop?: string
  wantNetworking?: string
  meetingType?: string
  meetingNote?: string

  startupName?: string
  stage?: string
  pitchOneLine?: string
  pitchDetail?: string
  traction?: string
  extraMembers?: string
  extraMemberList?: string
  /** The pass's second seat — see coFounderOptions in @/content/tickets. */
  coFounder?: string
  coFounderName?: string
  coFounderPhone?: string
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
/*
 * NOT "reply to this email" in the footer: these go out from a send-only address, and an
 * organiser notification's Reply-To is the registrant, so "reply" would mail the wrong
 * person entirely. One address to write to — site.contactEmail, via organiserContact.
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
                    ${esc(site.datesCompact)}
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
                Questions? Write to
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
/*
 * The address printed in every email footer as "write to us".
 *
 * site.contactEmail, NOT the SMTP env: MAIL_FROM is a sending identity that has to be
 * verified with the mail provider and is often a noreply@ or a provider subdomain, which is
 * the last thing to show someone who wants to reach a human. Where a reply actually goes is
 * a separate setting — see mailReplyTo in ./mailer.
 */
const organiserContact = site.contactEmail

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
 * Pass-specific detail rows
 * ------------------------------------------------------------------ */

/**
 * The rows a given registration actually has, in the inline style both the approved
 * waitlist template and the paid receipt use for their details tables.
 *
 * Built rather than hard-coded because the four passes ask four different sets of
 * questions. Hard-coding every possible row would put a label with nothing beside it in
 * most emails — "Startup —" on a Delegate Pass receipt is worse than no row at all,
 * because it reads as data we lost rather than a question we never asked.
 *
 * Returns trusted markup, so it is substituted BEFORE fillTokens rather than through it
 * (fillTokens escapes, which would print the tags as text). Every value inside is passed
 * through esc() here instead.
 */
function passDetailRows(r: Registration, ticket?: Ticket | null): string {
  const rows: [string, string][] = []

  if (ticket) rows.push(['Pass', ticket.name])
  if (r.orgName) rows.push([orgLabelFor(r), r.orgName])
  // The type sits ON the ID row rather than above it — "ID / registration: Aadhaar Card
  // ending 4471" reads as one fact, which is what it is. A separate row would push the
  // number away from the word that says what it is.
  if (r.idNumber) rows.push([idRowLabel(r), r.idNumber])
  if (r.designation) rows.push(['Designation', r.designation])
  if (r.interest) rows.push(['Interest', labelOf(r.interest, interestOptions)])
  if (r.startupName) rows.push(['Startup', r.startupName])
  if (r.stage) rows.push(['Stage', labelOf(r.stage, stageOptions)])
  if (r.sector) rows.push(['Sector', r.sector])
  if (r.workshop) rows.push(['Workshop', labelOf(r.workshop, workshopOptions)])
  if (r.wantNetworking) {
    rows.push([
      'Power networking',
      r.meetingType ? `Yes — ${labelOf(r.meetingType, meetingTypeOptions)}` : 'Yes',
    ])
  }
  // Team size, not "extra members": the number people care about is how many are coming.
  rows.push(...teamRows(r, { forRegistrant: true }))

  return rows
    .map(
      ([label, value]) =>
        `      <tr><td style="padding:6px 0;font-size:14px;color:#7A8798;">${esc(label)}</td>` +
        `<td style="padding:6px 0;font-size:14px;color:#3D4A5C;">${esc(value)}</td></tr>`,
    )
    .join('\n')
}

/**
 * The Team rows for any email, as [label, value] pairs.
 *
 * On a pass with a co-founder seat, that seat gets its own row — the second person on the
 * pass is who the desk and the bootcamp need to know about — and "Team" counts the two
 * included seats plus paid extras (1 for a solo founder). For a registrant whose co-founder's
 * name is still to come, the row says how to send it, so the reminder lives in the one
 * email they are certain to keep.
 *
 * Elsewhere it is the old rule: a Team row only when there are extras, counting the
 * registrant plus extras.
 */
function teamRows(r: Registration, opts: { forRegistrant: boolean }): [string, string][] {
  const extras = Number.parseInt(r.extraMembers || '0', 10)
  const n = Number.isFinite(extras) ? extras : 0
  const rows: [string, string][] = []
  if (r.coFounder) {
    const who = coFounderSummary(r.coFounder, r.coFounderName, r.coFounderPhone)
    rows.push([
      'Co-founder',
      r.coFounder === 'later' && opts.forRegistrant
        ? `${who} — email ${site.contactEmail} with their name`
        : who,
    ])
    const size = teamSize(r.coFounder, n)
    rows.push(['Team', `${size} ${size === 1 ? 'person' : 'people'}${r.extraMemberList ? ` — also ${r.extraMemberList}` : ''}`])
  } else if (n > 0) {
    rows.push(['Team', `${n + 1} people${r.extraMemberList ? ` — ${r.extraMemberList}` : ''}`])
  }
  return rows
}

/** Same rows, as aligned plain text for the text/plain part. */
function passDetailText(r: Registration, ticket?: Ticket | null, forRegistrant = true): string[] {
  const out: string[] = []
  const add = (label: string, value: string) => out.push(`${label.padEnd(15)}${value}`)
  if (ticket) add('Pass', ticket.name)
  if (r.orgName) add(orgLabelFor(r), r.orgName)
  if (r.idNumber) add('ID / reg', r.idNumber)
  if (r.designation) add('Designation', r.designation)
  if (r.startupName) add('Startup', r.startupName)
  if (r.stage) add('Stage', labelOf(r.stage, stageOptions))
  if (r.sector) add('Sector', r.sector)
  if (r.workshop) add('Workshop', labelOf(r.workshop, workshopOptions))
  if (r.wantNetworking) {
    add('Networking', r.meetingType ? `Yes — ${labelOf(r.meetingType, meetingTypeOptions)}` : 'Yes')
  }
  for (const [label, value] of teamRows(r, { forRegistrant })) add(label, value)
  return out
}

/** 'workshop-2' -> 'Workshop B — …'. Falls back to the raw value for old rows. */
function labelOf(value: string, options: readonly { value: string; label: string }[]): string {
  return options.find((o) => o.value === value)?.label || value
}

/**
 * What to call the organisation, given the category.
 *
 * A TBI member's organisation is a TBI; a founder's is a startup. Reusing one generic
 * "Organisation" label for both loses the distinction the form went to the trouble of
 * making. Falls back to the generic word when the category is missing — old rows.
 */
/**
 * What to call the ID row: "ID / registration" normally, "Aadhaar Card" and so on for a
 * member of the public who told us which document they will carry. The desk is matching a
 * person to a card, and the card's name is the useful half of that.
 */
function idRowLabel(r: Registration): string {
  return r.idType ? labelOf(r.idType, idTypeOptions) : 'ID / registration'
}

function orgLabelFor(r: Registration): string {
  const cfg = r.category && r.category in categories ? categories[r.category as CategoryId] : null
  return cfg?.orgLabel || 'Organisation'
}

/*
 * The free-pass templates' detail rows, reproducing the approved artwork's markup exactly —
 * one builder per template, because the confirmation uses a compact row and the alert a
 * bordered, uppercase-label one. They return '' when there is nothing to show, so a
 * question the form never asked does not print as an empty label. See approved.ts.
 */
function confirmRow(label: string, value: string | undefined): string {
  if (!(value || '').trim()) return ''
  return `          <tr>
            <td width="150" style="padding:7px 12px 7px 0;font-size:12px;line-height:18px;color:#7C8CA6;vertical-align:top;">${esc(label)}</td>
            <td style="padding:7px 0;font-size:12px;line-height:18px;color:#12305C;">${esc(value!.trim())}</td>
          </tr>`
}

function alertRow(label: string, value: string | undefined): string {
  if (!(value || '').trim()) return ''
  return `          <tr>
            <td width="140" style="padding:12px 12px 12px 0;border-top:1px solid #E4E8EE;font-size:10px;line-height:15px;font-weight:bold;color:#8B93A3;letter-spacing:1px;text-transform:uppercase;vertical-align:top;">${esc(label)}</td>
            <td style="padding:12px 0;border-top:1px solid #E4E8EE;font-size:13px;line-height:19px;color:#12305C;">${esc(value!.trim())}</td>
          </tr>`
}

/**
 * The single-line row style the waitlist and paid confirmations share. Like confirmRow and
 * alertRow it returns '' for an empty value — used for "Registered as", which is empty for
 * every registration while ASK_ATTENDING_AS is off.
 */
function plainRow(label: string, value: string | undefined): string {
  if (!(value || '').trim()) return ''
  return `      <tr><td style="padding:6px 0;font-size:14px;color:#7A8798;">${esc(label)}</td><td style="padding:6px 0;font-size:14px;color:#3D4A5C;">${esc(value!.trim())}</td></tr>`
}

/** "Name · <startup or category> · City" without an empty middle when there is neither. */
function joinDot(...parts: (string | undefined)[]): string {
  return parts.filter((x) => (x || '').trim()).join(' · ')
}

/** Plain-text rows for the same fields, dropped when empty for the same reason. */
function optionalTextRows(r: Registration, withDesignation: boolean): [string, string][] {
  const rows: [string, string][] = []
  if (r.orgName?.trim()) rows.push([orgLabelFor(r), r.orgName.trim()])
  if (r.idNumber?.trim()) rows.push([idRowLabel(r), r.idNumber.trim()])
  if (withDesignation && r.designation?.trim()) rows.push(['Designation', r.designation.trim()])
  return rows
}

/**
 * The tokens both free-pass templates share.
 *
 * One object, because the confirmation and the alert print the same registration and a
 * reader who compares them should not find two different spellings of the same city.
 */
function freePassTokens(r: Registration, ticket?: Ticket | null): Record<string, string> {
  return {
    FIRST_NAME: firstName(r.name),
    NAME: r.name,
    EMAIL: r.email,
    PHONE: r.phone,
    PHONE_HREF: r.phone.replace(/[^\d+]/g, ''),
    PASS: ticket?.name || 'Free Pass',
    REGISTERED_AS: r.registerAs,
    CITY: r.city,
    // The organisation, ID and designation are ROWS now, not tokens — see confirmRow /
    // alertRow. Only the alert's subject line still names the organisation inline.
    ORG_SUFFIX: r.orgName?.trim() ? ` · ${r.orgName.trim()}` : '',
    STATUS: FREE_PASS_STATUS,
    EVENT_DATES: site.dates,
    EVENT_DATES_SHORT: site.datesCompact.toUpperCase(),
    EVENT_LOCATION: `${site.venue}, ${site.city}`,
    CONTACT_EMAIL: site.contactEmail,
    CONTACT_PHONE: site.contactPhone,
    CONTACT_PHONE_HREF: site.contactPhone.replace(/[^\d+]/g, ''),
  }
}

/* ------------------------------------------------------------------ *
 * Participant confirmation
 * ------------------------------------------------------------------ */

export function participantEmail(
  r: Registration,
  ticket?: Ticket | null,
): { subject: string; html: string; text: string } {
  /*
   * A FREE PASS IS NOT A WAITLIST ENTRY, and since August 2026 it does not get told it
   * is one. The template below this branch says "ticketing isn't live yet — the payment
   * link is being set up now", which is the right thing to say to somebody who wanted a
   * Delegate Pass while the till was shut, and quite wrong for somebody whose pass costs
   * nothing and is confirmed the moment they submit.
   *
   * Branching here rather than at the call site so /api/register stays one path: the
   * route sends "the participant email", and which artwork that is belongs to the
   * templates.
   */
  if (ticket && isFreePass(ticket)) return freePassParticipantEmail(r, ticket)

  const rows = passDetailRows(r, ticket)
  const tokens = {
    FIRST_NAME: firstName(r.name),
    NAME: r.name,
    EMAIL: r.email,
    PHONE: r.phone,
    // The "Sector" row in the approved markup became "Pass": sector is now asked only on
    // the Investor Pitch Pass, whereas which pass they joined the list for is the one
    // thing every reader of this email wants confirmed back to them.
    PASS: ticket?.name || r.registerAs,
    REGISTERED_AS: r.registerAs,
    CITY: r.city,
    EVENT_DATES: site.dates,
    EVENT_LOCATION: `${site.venue}, ${site.city}`,
    EXTRA_ROWS: rows,
    CONTACT_EMAIL: site.contactEmail,
    CONTACT_PHONE: site.contactPhone,
    CONTACT_PHONE_HREF: site.contactPhone.replace(/[^\d+]/g, ''),
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
    ...(r.registerAs ? [`Attending as   ${r.registerAs}`] : []),
    `City           ${r.city}`,
    ...passDetailText(r, ticket),
    '',
    'See you in Erode.',
    'Team Tier-2 Rising · NammaOffice',
    '',
    '—',
    'TIER-2 RISING STARTUP SUMMIT',
    'NammaOffice Presents · In association with Startup Singam',
    `${site.contactEmail} · ${site.contactPhone}`,
  ].join('\n')

  // EXTRA_ROWS is markup we built, not user input, so it goes in before fillTokens —
  // which escapes, and would print the <tr> tags as visible text. Every value inside it
  // was passed through esc() by passDetailRows.
  const html = REGISTRANT_CONFIRMATION_HTML.replace('{{EXTRA_ROWS}}', rows).replace(
    '{{REGISTERED_AS_ROW}}',
    plainRow('Registered as', r.registerAs),
  )
  return {
    subject: fillTokens(REGISTRANT_SUBJECT, tokens, { escape: false }),
    text,
    html: fillTokens(html, tokens),
  }
}


/**
 * Every pass-specific answer, as organiser detail rows.
 *
 * Fuller than the attendee-facing passDetailRows: this is the copy a human works from.
 * The pitch narrative in particular is the whole point of the Investor Pitch Pass form —
 * the selection panel reads it here, and truncating it to fit a layout would mean
 * opening the sheet to do the actual job.
 *
 * The last row is marked `last` so the table closes cleanly whatever the pass, rather
 * than a hard-coded field having to be the final one.
 */
function organiserExtraRows(r: Registration): string {
  const rows: [string, string][] = []
  if (r.orgName) rows.push([orgLabelFor(r), r.orgName])
  if (r.idNumber) rows.push([idRowLabel(r), r.idNumber])
  if (r.designation) rows.push(['Designation', r.designation])
  if (r.interest) rows.push(['Interest', labelOf(r.interest, interestOptions)])
  if (r.workshop) rows.push(['Workshop', labelOf(r.workshop, workshopOptions)])
  if (r.wantNetworking) {
    rows.push(['Power networking', r.meetingType ? labelOf(r.meetingType, meetingTypeOptions) : 'Yes'])
  }
  if (r.meetingNote) rows.push(['Meeting agenda', r.meetingNote])
  if (r.startupName) rows.push(['Startup', r.startupName])
  if (r.stage) rows.push(['Stage', labelOf(r.stage, stageOptions)])
  if (r.sector) rows.push(['Sector', r.sector])
  if (r.pitchOneLine) rows.push(['One-line pitch', r.pitchOneLine])
  if (r.pitchDetail) rows.push(['Problem & solution', r.pitchDetail])
  if (r.traction) rows.push(['Traction', r.traction])
  rows.push(...teamRows(r, { forRegistrant: false }))
  if (!rows.length) return ''
  return rows.map(([l, v], i) => detailRow(l, v, { last: i === rows.length - 1 })).join('\n')
}

/* ------------------------------------------------------------------ *
 * Organiser notification
 * ------------------------------------------------------------------ */

export function organiserEmail(
  r: Registration,
  at = new Date(),
  ticket?: Ticket | null,
): {
  subject: string
  html: string
  text: string
} {
  /*
   * "Waitlist entry", not "registration".
   *
   * /api/register is now ONLY the waitlist path — a free pass, or a paid pass while
   * REGISTRATION_PAYMENT_ENABLED is off. Anything actually paid for is fulfilled through
   * payments/fulfil.ts and sends paidOrganiserEmail instead. Calling both "New
   * registration" made the two indistinguishable in an inbox, which matters because one
   * needs following up when passes open and the other is already money in the account.
   *
   * The pass is in the subject because that is how these get triaged: an Investor Pitch
   * application needs a panel, a Free Pass needs a batch allocation.
   */
  if (ticket && isFreePass(ticket)) return freePassOrganiserEmail(r, ticket, at)

  const subject = `Waitlist — ${ticket?.name || 'pass'} — ${joinDot(r.name, r.startupName || r.registerAs, r.city)}`
  const when = stamp(at)

  const body = `
          <!-- Hero -->
          <tr>
            <td style="background-color:${C.white};padding:40px 36px 0 36px;font-family:${FONT};">
              <div style="font-size:11px;font-weight:700;letter-spacing:0.16em;color:${C.orange};text-transform:uppercase;">New waitlist entry${
                ticket ? ` &middot; ${esc(ticket.name)}` : ''
              }</div>
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
${r.registerAs ? detailRow('Attending as', r.registerAs) : ''}
${detailRow('City', r.city)}
${organiserExtraRows(r)}
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
                A waitlist confirmation has already gone out to ${esc(r.email)}. The row is in the registrations
                sheet with Payment Status <strong>Waitlist</strong> &mdash; nothing has been charged.
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
    ...(r.registerAs ? [`Attending as   ${r.registerAs}`] : []),
    `City           ${r.city}`,
    ...passDetailText(r, ticket, false),
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
      preheader: joinDot(r.name, r.startupName || r.registerAs, r.city, r.email),
      body,
      footerNote: 'Automated notification from the pass waitlist on the summit website.',
    }),
  }
}

/* ------------------------------------------------------------------ *
 * Free pass — confirmation + internal alert
 *
 * Separate artwork from the waitlist pair above, supplied by the client in August 2026.
 * Both are FIXED tables rather than {{EXTRA_ROWS}} builds, and that is fine here where
 * it would not be for the paid receipt: a free pass never asks a workshop question or a
 * startup question, and its three categories all carry an organisation and an ID. The
 * field list therefore cannot vary, so there is nothing to assemble.
 * ------------------------------------------------------------------ */

/**
 * A plain-text detail block, aligned to its own longest label.
 *
 * Not a fixed column width. The labels are category-dependent — "City" and "Organisation
 * / company name" can appear in the same block — so any constant is either too wide for
 * the short ones or too narrow for the long ones, and too narrow is the visible failure:
 * the value collides with the label and the column stops existing.
 */
function textRows(pairs: [string, string][]): string[] {
  const width = Math.max(...pairs.map(([l]) => l.length))
  return pairs.map(([l, v]) => `${l.padEnd(width)}  ${v}`)
}

function freePassParticipantEmail(
  r: Registration,
  ticket: Ticket,
): { subject: string; html: string; text: string } {
  const tokens = freePassTokens(r, ticket)
  const text = [
    `THANKS, ${firstName(r.name).toUpperCase()}. YOU'RE REGISTERED.`,
    '',
    'Your details have been successfully registered, and your Free Pass is confirmed.',
    '',
    'We will share the detailed agenda and check-in information closer to the event',
    'date. Please keep your valid ID card and registration details handy, as it will',
    'be required for verification at the registration desk. Please note that seating',
    'for the sessions will be available on a first-come, first-served basis.',
    '',
    'FREE PASS ACCESS: Your pass provides access to the Stall Area and Main Hall only.',
    'Access to other designated areas or sessions may require a separate pass.',
    '',
    'One impactful day in Erode, where investors, government scheme officers, and bank',
    'credit heads come to Tier-2, bringing opportunities closer to entrepreneurs.',
    '',
    '5 Growth Zones open throughout the day, 10 startups coached, and 3 startups',
    'pitching live on the main stage — all designed to connect, empower, and accelerate',
    'the next generation of businesses.',
    '',
    site.dates,
    `${site.venue}, ${site.city}`,
    '',
    'Explore the summit: https://tier2rising.com/',
    '',
    'YOUR DETAILS',
    ...textRows([
      ['Name', r.name],
      ['Email', r.email],
      ['Phone', r.phone],
      ['Pass', tokens.PASS],
      ...(r.registerAs ? ([['Registered as', r.registerAs]] as [string, string][]) : []),
      ['City', r.city],
      ...optionalTextRows(r, false),
      ...(r.interest
        ? ([['Interest', labelOf(r.interest, interestOptions)]] as [string, string][])
        : []),
    ]),
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
    subject: fillTokens(FREE_PASS_SUBJECT, tokens, { escape: false }),
    text,
    // Rows are markup, so they go in before fillTokens escapes.
    html: fillTokens(
      FREE_PASS_CONFIRMATION_HTML.replace('{{REGISTERED_AS_ROW}}', confirmRow('Registered as', r.registerAs))
        .replace('{{ORG_ROW}}', confirmRow(orgLabelFor(r), r.orgName)).replace(
        '{{ID_ROW}}',
        confirmRow(idRowLabel(r), r.idNumber),
      ),
      tokens,
    ),
  }
}

function freePassOrganiserEmail(
  r: Registration,
  ticket: Ticket,
  at: Date,
): { subject: string; html: string; text: string } {
  const tokens = freePassTokens(r, ticket)
  const when = stamp(at)
  const text = [
    'NEW REGISTRATION — FREE PASS',
    '',
    r.name,
    `Submitted ${when}`,
    '',
    ...textRows([
      ['Name', r.name],
      ['Email', r.email],
      ['Phone', r.phone],
      ...(r.registerAs ? ([['Attending as', r.registerAs]] as [string, string][]) : []),
      ['City', r.city],
      ...optionalTextRows(r, true),
      ...(r.interest
        ? ([['Interest', labelOf(r.interest, interestOptions)]] as [string, string][])
        : []),
    ]),
    '',
    `A registration confirmation has already gone out to ${r.email}.`,
    `The row is in the registrations sheet with Status ${FREE_PASS_STATUS} —`,
    'the free pass carries no charge.',
    '',
    '—',
    `${site.fullName}`,
  ].join('\n')

  /*
   * The Interest row exists only when there is an interest — public registrations. A
   * fixed row would print "Interest —" on every college and TBI entry, which is a blank
   * pretending to be an answer. It is markup, so it goes in before fillTokens escapes.
   */
  const interestRow = alertRow('Interest', r.interest ? labelOf(r.interest, interestOptions) : '')

  return {
    // escape:false — a mail header is not HTML, and esc() would print &#39; for the
    // apostrophe in an organisation name.
    subject: fillTokens(FREE_PASS_ALERT_SUBJECT, { ...tokens, SUBMITTED_AT: when }, { escape: false }),
    text,
    html: fillTokens(
      FREE_PASS_ALERT_HTML.replace('{{REGISTERED_AS_ROW}}', alertRow('Attending as', r.registerAs))
        .replace('{{ORG_ROW}}', alertRow(orgLabelFor(r), r.orgName))
        .replace('{{ID_ROW}}', alertRow(idRowLabel(r), r.idNumber))
        .replace('{{DESIGNATION_ROW}}', alertRow('Designation', r.designation))
        .replace('{{INTEREST_ROW}}', interestRow),
      { ...tokens, SUBMITTED_AT: when },
    ),
  }
}

/* ------------------------------------------------------------------ *
 * Partner enquiries — the "Partner with us" dialog in the header
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
    // MIND THE TWO MEANINGS OF "CONTACT" in this template's token names: CONTACT_NAME and
    // CONTACT_FIRST_NAME are the PARTNER'S contact person, while CONTACT_EMAIL and
    // CONTACT_PHONE are OURS, in the footer. The artwork named them; they are kept as-is
    // rather than renamed, but the footer ones were missing here, so it rendered a footer
    // with no address at all.
    CONTACT_FIRST_NAME: firstName(p.name),
    CONTACT_NAME: p.name,
    COMPANY_NAME: p.businessName,
    EMAIL: p.email,
    PHONE: p.phone,
    EVENT_DATES: site.dates,
    EVENT_LOCATION: `${site.venue}, ${site.city}`,
    CONTACT_EMAIL: site.contactEmail,
    CONTACT_PHONE: site.contactPhone,
    CONTACT_PHONE_HREF: site.contactPhone.replace(/[^\d+]/g, ''),
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
    `${site.contactEmail} · ${site.contactPhone}`,
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
      footerNote: 'Automated notification from the Partner with us form on the summit website.',
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
  /**
   * Why this receipt is not a real one — null when it is. Stamps a warning banner so a
   * staging booking cannot pass as a genuine pass. See ReceiptCaveat in ./paid for why
   * this is a three-state field rather than the boolean `testMode` it replaced.
   */
  caveat: ReceiptCaveat
}

/**
 * What the bought pass actually admits you to — "Stall zone · Main hall", "Full founder
 * track · Pitch bootcamp · Investor connect" — read from the ticket catalogue rather than
 * written out here, so a receipt cannot contradict the card that sold it.
 *
 * Falls back to the event date when the id is missing or unknown. That is the honest
 * answer for a recovered order: the summit runs that day and we are not going to invent
 * an entitlement we cannot look up.
 */
export function accessLabel(pay: PaymentInfo): string {
  return ticketAccess(pay.ticketId) || site.dates
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
  // Both of these are trusted markup, so they are substituted BEFORE fillTokens rather
  // than through it — fillTokens escapes, which would print the tags as text.
  const withBanner = PAID_CONFIRMATION_HTML.replace(
    '{{TEST_BANNER}}',
    caveatBanner(pay.caveat),
  )
    .replace('{{EXTRA_ROWS}}', passDetailRows(r, null))
    .replace('{{REGISTERED_AS_ROW}}', plainRow('Attending as', r.registerAs))

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
    ...(pay.caveat ? [caveatLine(pay.caveat), ''] : []),
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
    ...(r.registerAs ? [`Attending as   ${r.registerAs}`] : []),
    `City           ${r.city}`,
    // The pass name is already in the receipt block above, so it is not repeated here.
    ...passDetailText(r, null),
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
                pay.caveat ? ` · ${CAVEAT_LABEL[pay.caveat]}` : ''
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
${r.registerAs ? detailRow('Attending as', r.registerAs) : ''}
${detailRow('City', r.city)}
${organiserExtraRows(r)}
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
    `PAID REGISTRATION${pay.caveat ? ` (${CAVEAT_LABEL[pay.caveat].toUpperCase()})` : ''}`,
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
    ...(r.registerAs ? [`Attending as   ${r.registerAs}`] : []),
    `City           ${r.city}`,
    ...passDetailText(r, null, false),
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
function alertMode(caveat: ReceiptCaveat): string {
  if (caveat === 'test-keys') return 'TEST — no money moved'
  if (caveat === 'test-price') return 'LIVE keys, STAGING TEST PRICE — refund, do not seat'
  return 'LIVE'
}

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
    // Spells the caveat out rather than printing TEST/LIVE: whoever picks this alert up
    // is about to re-enter a row by hand, and "LIVE" on a ₹2 staging booking would have
    // them chasing a real seat for a payment that was never a purchase.
    ['Mode', alertMode(pay.caveat)],
    ['Name', r.name],
    ['Email', r.email],
    ['Phone', r.phone],
    ...(r.registerAs ? ([['Attending as', r.registerAs]] as [string, string][]) : []),
    ['City', r.city],
    // Startup name is what makes an Investor Pitch payment identifiable when someone has
    // to reconcile this by hand against the sheet.
    ...(r.startupName ? ([['Startup', r.startupName]] as [string, string][]) : []),
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
