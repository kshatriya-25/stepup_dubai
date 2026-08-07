/**
 * Brevo SMTP transport.
 *
 * Server-only. Every value here comes from a NON-`NEXT_PUBLIC_` env var, which is
 * what keeps SMTP_PASS out of the browser bundle — `NEXT_PUBLIC_*` vars are inlined
 * into client JavaScript at build time and would publish the password.
 *
 * The transporter is cached on globalThis because Next's dev server re-evaluates
 * modules on every hot reload; without this you leak a connection pool per edit.
 */

import 'server-only'
import nodemailer, { type Transporter } from 'nodemailer'

const g = globalThis as typeof globalThis & { __mailer?: Transporter }

export const mailFrom = process.env.MAIL_FROM || 'info@tier2rising.com'
export const mailFromName = process.env.MAIL_FROM_NAME || 'Tier-2 Rising Startup Summit'
export const mailReplyTo = process.env.MAIL_REPLY_TO || mailFrom

/** Comma-separated in env, so you can notify more than one inbox. */
function recipientList(value: string | undefined): string[] {
  return (value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

/** Who gets the attendee-registration notification. */
export const organiserRecipients = recipientList(process.env.MAIL_ORGANISER).length
  ? recipientList(process.env.MAIL_ORGANISER)
  : [mailFrom]

/**
 * Who gets the partner-enquiry notification.
 *
 * Separate from MAIL_ORGANISER because sponsorship leads often want a different
 * inbox from ticket registrations. Falls back to MAIL_ORGANISER when unset, so
 * leaving it out simply means "same people".
 */
export const partnerRecipients = recipientList(process.env.MAIL_PARTNER_ORGANISER).length
  ? recipientList(process.env.MAIL_PARTNER_ORGANISER)
  : organiserRecipients

/** True when SMTP is configured well enough to attempt a send. */
export function mailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
}

function transport(): Transporter {
  if (g.__mailer) return g.__mailer
  const port = Number(process.env.SMTP_PORT || 587)
  g.__mailer = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    // 587 is STARTTLS: connect in the clear, then upgrade. Only 465 is implicit TLS.
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    pool: true,
    maxConnections: 3,
  })
  return g.__mailer
}

export type Mail = {
  to: string | string[]
  subject: string
  html: string
  text: string
  replyTo?: string
}

/**
 * Send one message. Resolves to a result rather than throwing, so the caller can
 * record a registration even when mail delivery fails — a lost lead is worse than
 * a missing confirmation email.
 */
export async function sendMail(mail: Mail): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!mailConfigured()) return { ok: false, error: 'SMTP is not configured' }
  try {
    const info = await transport().sendMail({
      from: `"${mailFromName}" <${mailFrom}>`,
      to: mail.to,
      replyTo: mail.replyTo || mailReplyTo,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    })
    return { ok: true, id: info.messageId }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

/** Verifies credentials against the relay without sending anything. */
export async function verifyMail(): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!mailConfigured()) return { ok: false, error: 'SMTP is not configured' }
  try {
    await transport().verify()
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}
