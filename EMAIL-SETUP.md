# Registration emails (Brevo SMTP)

Every successful registration sends **two** emails:

| To | Subject | Purpose |
|---|---|---|
| The participant | `You're on the list — Tier-2 Rising Startup Summit, 10 & 11 October 2026` | Branded confirmation, event details, what happens next, a copy of what they submitted |
| The organiser | `New registration — <name> · <sector> · <city>` | Notification with all fields, one-tap reply/call. `Reply-To` is the participant, so hitting reply writes to them |

```
Form  ──POST /api/register──▶  Next.js route (Node, server-side)
                                   ├──▶ Apps Script ──▶ Google Sheet   (must succeed)
                                   ├──SMTP──▶ participant confirmation (best effort)
                                   └──SMTP──▶ organiser notification   (best effort)
```

The Sheet write is the only step that can fail the request. If SMTP is down the
registration is still captured and the visitor still sees the success state — a lost
lead is worse than a missing email. Mail failures are logged to the server console
with the `[register]` prefix.

## Environment variables

All server-side. **None of them may be renamed with a `NEXT_PUBLIC_` prefix** — that
prefix inlines a value into the browser bundle at build time, which for `SMTP_PASS`
would publish the password and let anyone send mail as your domain. `.env` is
gitignored; keep it that way.

```bash
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587                      # 587 = STARTTLS. Only 465 is implicit TLS.
SMTP_USER=b4a1a5001@smtp-brevo.com
SMTP_PASS=xsmtpsib-…               # Brevo SMTP key

MAIL_FROM=info@tier2rising.com
MAIL_FROM_NAME=Tier-2 Rising Startup Summit
MAIL_REPLY_TO=info@tier2rising.com
MAIL_ORGANISER=info@tier2rising.com   # comma-separated for more than one inbox

NEXT_PUBLIC_SITE_URL=https://tier2rising.com   # link target inside the emails
```

## Two things to do in Brevo before mail flows

Both are account settings, not code. Skip either and sending fails or lands in spam.

### 1. Authorise the server's IP  ⚠️ currently blocking

Brevo rejected a test authentication with:

```
525 5.7.1 Unauthorized IP address
```

That means the account has **Authorised IPs** switched on and only allowlisted IPs
may send. Fix it in Brevo → **Account (top-right) → Security → Authorised IPs**:
add the production server's public IP (`curl -s ifconfig.me` on the box), or turn
the restriction off.

Add your office/laptop IP too if you want to test locally.

### 2. Verify the sending domain

`MAIL_FROM` is `info@tier2rising.com`, so **tier2rising.com** must be verified in
Brevo → **Senders, Domains & Dedicated IPs → Domains**. That means adding Brevo's
DKIM/DMARC records to the domain's DNS. Unverified domains get delivered to spam
or rejected outright by Gmail and Outlook.

> Note the domain mismatch: the site's public contact address is
> `hello@tier2rising.in` (`src/content/site.ts:22`) but mail sends from
> `tier2rising.com`. Both are fine, but each domain you send *from* needs its own
> verification.

## Preview the emails without sending

The dev server exposes a preview route (development only — it 404s in production):

```bash
npm run dev
open http://localhost:3000/api/email-preview                 # participant
open http://localhost:3000/api/email-preview?type=organiser  # organiser
```

Override the sample data with query params to check long names, odd cities, etc.:

```
/api/email-preview?name=Priya%20Raman&city=Salem&sector=Textiles%20and%20garments
```

## Check what's wired

`GET /api/register` is a health check that reports config without sending anything:

```bash
curl -s https://tier2rising.com/api/register
{"ok":true,"service":"tier2-rising-registrations","sheet":"configured","mail":"configured","organiser":["info@tier2rising.com"]}
```

`"NOT CONFIGURED"` on either field means the corresponding env vars are missing from
the server's `.env`.

## Editing the emails

Everything lives in [`src/lib/email/templates.ts`](src/lib/email/templates.ts).
Event facts (dates, venue, city, presenter line) are read from
`src/content/site.ts`, so change them **there** and both emails follow.

These are email templates, not web pages — the constraints are deliberate:

- **Table layout only.** No flexbox, no grid, no float. Outlook renders none of them.
- **Inline styles only.** Gmail strips `<style>` blocks when it clips a message.
- **No external images.** Most clients block remote images by default, so the design
  has to be complete with images off. The wordmark is type, not a logo file.
- **Explicit `background-color` on every cell**, which limits how badly dark-mode
  auto-inversion can mangle the palette.
- **600px width** — the safe maximum across Outlook's rendering surface.
- Every interpolated value is HTML-escaped. Registrations are untrusted input.

Each template returns `{ subject, html, text }`. Keep the plain-text version in sync
when you edit copy — some clients show it, and a missing text part hurts spam scores.

## Abuse protection

The endpoint is public and triggers outbound mail, so two guards sit in
[`src/app/api/register/route.ts`](src/app/api/register/route.ts):

- **Honeypot** — a `reg_note` field hidden off-screen and skipped in tab order. Only
  bots fill it; those submissions get a success response and are discarded. Every hit
  is logged as `[register] honeypot tripped`, because this branch throws a registration
  away and a false positive is otherwise invisible.

  > The field was originally named `company`, which browsers autofilled from the saved
  > address profile ("Organization") — silently binning real registrations while showing
  > the visitor a thank-you. If you ever rename it, pick something no autofill heuristic
  > recognises: not `company`, `organization`, `address`, `url`, `nickname` or similar.
- **Rate limit** — 5 registrations per IP per hour, in memory. Fine for the current
  single-process deployment; move it to Redis only if you ever run more than one
  Node process.

## Troubleshooting

**`525 5.7.1 Unauthorized IP address`** — the sending IP isn't allowlisted. See
"Authorise the server's IP" above.

**`535 authentication failed`** — `SMTP_USER`/`SMTP_PASS` are wrong, or the SMTP key
was regenerated in Brevo. Generate a fresh one under **SMTP & API → SMTP**.

**Mail lands in spam** — the sending domain isn't verified, or DKIM/DMARC records
haven't propagated. Check Brevo → Domains, then test at <https://www.mail-tester.com>.

**Registration succeeds but no email arrives** — check the server log for
`[register] participant mail failed:` / `[register] organiser mail failed:`. The
message after the colon is Brevo's own error text. Also check Brevo → **Transactional
→ Logs**, which shows every accepted message and its delivery state.

**Nothing reaches the Sheet** — `GET /api/register` will say `sheet: NOT CONFIGURED`
if the endpoint URL is missing. If it's configured but writes fail, the Apps Script
deployment's *Who has access* is probably not **Anyone**; see REGISTRATION-SETUP.md.

**Brevo free-tier limit** — 300 emails/day. Each registration costs 2. Above roughly
150 registrations a day you need a paid plan.
