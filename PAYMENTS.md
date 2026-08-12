# Payments — Razorpay integration runbook

Tickets are the paid flow: the buyer pays first, and the registration is recorded only
once Razorpay confirms the money was captured.

**The registration form itself is free.** It is a waitlist — leave your details, hear
first when something opens — and sends the client-approved waitlist email. Paying
happens in the ticket section (`#tickets`), where the visitor picks one of three
passes. Partner enquiries are unaffected and remain free.

This document is the operational guide. If you only read one section, read
[When a customer pays but is not registered](#when-a-customer-pays-but-is-not-registered).

---

## 1. The one problem this design exists to solve

A payment and a registration live in two different systems: Razorpay on one side, the
Google Sheet plus Brevo on the other. Every moment between *money captured* and
*registration recorded* is a window in which a crash, a deploy, a killed pm2 process or
a dropped mobile connection takes the customer's money and loses their seat.

Everything below — the journal, the webhook, the reconciliation sweep — exists to close
that window. The invariant the whole subsystem upholds:

> **No payment ever ends up both captured and silent.**
> Either the registration is recorded, or a human has been emailed about it.

---

## 2. How it fits together

Three independent paths can settle a payment. They race on purpose; whichever arrives
first does the work, and the others see it is done and stop. Duplicated *effort* is
fine, duplicated *effect* is not.

| Path | Route | When it runs | Reliability |
|---|---|---|---|
| Browser | `POST /api/payment/verify` | Immediately after Checkout succeeds | Fast, but dies with the tab |
| Webhook | `POST /api/payment/webhook` | Razorpay calls us, server to server | **The reliable one** |
| Sweep | `GET /api/payment/reconcile` | Hourly cron | Last resort, catches everything else |

The flow:

```
Ticket card (#tickets) ──► checkout sheet: details + chosen pass
   │  POST /api/payment/order      price the ticket, journal the intent, create the order
   ▼
Razorpay Checkout                  customer pays
   │
   ├── browser returns ──► /api/payment/verify ──┐
   ├── Razorpay calls  ──► /api/payment/webhook ─┼──► settle() ──► Sheet row + receipt
   └── nothing happens ──► /api/payment/reconcile┘        │
                                                          └──► on failure: ACTION REQUIRED email
```

**Why the webhook matters.** If a customer pays on their phone and immediately closes
the tab, `/verify` never fires. Without the webhook that registration is simply lost.
Do not go live without it configured.

### Where the data lives — two places, always

1. **The journal** (`PAYMENT_JOURNAL_PATH`) — append-only JSONL on disk, the fast path.
2. **The Razorpay order's `notes`** — every order carries the full registration payload
   into Razorpay's own storage.

That redundancy is deliberate. Losing the server's disk degrades recovery from *instant*
to *a sweep*, never to data loss. `/api/payment/reconcile` can rebuild a registration
from Razorpay alone.

### Key source files

| File | Responsibility |
|---|---|
| `src/lib/payments/razorpay.ts` | API client, HMAC verification, money helpers |
| `src/lib/payments/journal.ts` | Crash-safe record of every order and its state |
| `src/lib/payments/fulfil.ts` | `settle()` — the only place a payment becomes a registration |
| `src/app/api/payment/*` | The four routes |
| `src/lib/email/paid.ts` | The paid-confirmation receipt template |

---

## 3. Environment variables

All server-only. **None may ever be given a `NEXT_PUBLIC_` prefix** — that inlines the
value into the browser bundle, and publishing `RAZORPAY_KEY_SECRET` would let anyone
forge a "payment succeeded" callback and register for free.

```bash
# Master switch. 1 = the ticket section can take payments. Anything else = tickets off.
REGISTRATION_PAYMENT_ENABLED=1

RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx

# Razorpay dashboard → Settings → Webhooks. Must match exactly. REQUIRED in production.
RAZORPAY_WEBHOOK_SECRET=

# Protects /api/payment/reconcile. Unset = the endpoint 404s.  openssl rand -hex 32
PAYMENT_RECONCILE_SECRET=

# MUST be an absolute path. See section 4.
PAYMENT_JOURNAL_PATH=/var/www/tier2expo/stepup_dubai/data/payments.jsonl
```

### Prices are NOT in .env

The three ticket prices live in `src/content/tickets.ts`. The order endpoint prices an
order from that file and the pricing section renders its price tags from the same
import, so the figure shown and the figure charged are the same constant.

An env var could not give that guarantee: the homepage is statically prerendered, so an
env price is frozen into the HTML at build time, and a later change would leave the page
advertising one number while the server charged another.

Changing a price is therefore a code change — correct for money, since it goes through
review and lands in git history.

| Ticket | id | Price |
|---|---|---|
| Delegate Pass | `delegate` | ₹999 per person |
| Investor Pitch Day | `investor-pitch` | ₹2,599 per startup |
| Founder Programme | `founder` | ₹3,999 per startup |

The browser never sends an amount — only a ticket `id`. An unknown id is rejected
outright rather than defaulted to something cheap.

### ⚠️ Seat counts are copy, not inventory

The cards advertise "14 / 40 left" and "9 / 30 left". **Nothing decrements those numbers
when a ticket sells**, and nothing stops the 41st person buying a pitch slot. They are
static strings in `tickets.ts`.

If pitch slots are genuinely limited, either keep the counts vague ("Limited") or ask
for real inventory tracking to be built — overselling a slot that does not exist means
issuing refunds to founders you have already told they are pitching.

### The switch is explicit on purpose

It would be friendlier to infer "payment is on if the keys are present", but that fails
open in the worst way: a deploy that loses its env file would silently start giving
tickets away, and nobody would notice until the gate. With an explicit flag, a
half-configured deploy fails **loud** — `/api/payment/order` returns 503 and names the
missing variable — instead of failing cheap.

---

## 4. The journal path — read this before going live

### It must be absolute

`./data/payments.jsonl` resolves against `process.cwd()`, which for a pm2 process is
*whatever directory pm2 was started from*, not your app folder — and `pm2 restart`
reuses that original cwd. If pm2 was ever started from `/root`, that is where your
payment records are going.

```bash
PAYMENT_JOURNAL_PATH=/var/www/tier2expo/stepup_dubai/data/payments.jsonl
```

### It must be writable by the pm2 user

The app creates the directory itself (`mkdir -p` semantics), but it needs write
permission on the parent. If it cannot write:

- `/api/payment/order` returns **503 and refuses new payments**. Taking money we cannot
  reliably record is worse than briefly not taking money.
- Payments already captured are **still fulfilled** — a disk problem must never produce
  a 500 in front of somebody who has already been charged.
- `GET /api/payment/order` reports the exact error and path.
- It recovers by itself once permissions are fixed. No restart needed.

```bash
sudo mkdir -p /var/www/tier2expo/stepup_dubai/data
sudo chown -R $(ps -o user= -p $(pm2 pid tier2rising)) /var/www/tier2expo/stepup_dubai/data
sudo chmod 750 /var/www/tier2expo/stepup_dubai/data
```

### pm2 must be in fork mode, not cluster

The journal keeps an in-memory index. Two workers means two divergent indexes, which
breaks the exactly-once guarantee — duplicate sheet rows and duplicate receipts for a
single payment.

```bash
pm2 describe tier2rising | grep -Ei "exec mode|instances"
# want: exec mode → fork_mode,  instances → 1
```

If it says `cluster_mode` with more than one instance, fix it before taking real money.
To scale out later, move the journal to Redis or Postgres; the interface in
`journal.ts` is deliberately small.

### It contains customer PII — back it up, never commit it

`data/` is gitignored. The file holds names, emails, phone numbers and payment ids.
Include it in whatever backs up the server, and keep it out of any public bucket.

---

## 5. Deploying

Your existing sequence, unchanged:

```bash
cd /var/www/tier2expo/stepup_dubai
git pull
npm ci
npm run build      # do NOT skip this — next start serves the old .next otherwise
pm2 restart tier2rising
```

Then verify:

```bash
curl -s https://tier2rising.com/api/payment/order
```

Expected:

```json
{"ok":true,"enabled":true,"mode":"test","amount":"₹499",
 "journal":{"writable":true,"path":"/var/www/.../data/payments.jsonl"}}
```

Check every field. `enabled:false` means the switch is off; `writable:false` means
section 4; `mode` tells you whether real money is in play.

```bash
curl -s https://tier2rising.com/api/payment/webhook
# {"secret":"configured"}  — if it says NOT CONFIGURED, the webhook will reject everything
```

### Changing a price

Edit `src/content/tickets.ts`, then deploy as usual. Because the page and the server
read the same constant, a rebuild updates both together — there is no window in which
they disagree.

```bash
npm run build && pm2 restart tier2rising
```

---

## 6. Razorpay dashboard — webhook setup

**Settings → Webhooks → Add New Webhook**

| Field | Value |
|---|---|
| URL | `https://tier2rising.com/api/payment/webhook` |
| Secret | the same string as `RAZORPAY_WEBHOOK_SECRET` |
| Events | `payment.captured`, `payment.failed`, `order.paid` |

The signature is computed over the **raw request body**, so nothing between Razorpay and
Node may rewrite it. The standard Apache `ProxyPass` used by this site is fine.

Razorpay retries any non-2xx for roughly 24 hours with backoff. We use that
deliberately: when the Google Sheet is unreachable the webhook returns 500 so Razorpay
becomes a free, durable retry queue. The alert email is sent once per order, so retries
do not produce an inbox storm.

Test it from the dashboard's "Send test webhook" button and confirm a 200.

---

## 7. Reconciliation cron

The sweep asks Razorpay "what did you capture?" and fulfils anything we have not. It
recovers payments this server has never heard of — a wiped journal, a restore from an
old backup, an order from a previous deploy — by reading the registration back out of
the order's `notes`.

```bash
crontab -e
```

```cron
# Hourly payment reconciliation. Non-2xx if money is still unreconciled, so cron mails you.
17 * * * * curl -fsS "https://tier2rising.com/api/payment/reconcile?secret=YOUR_SECRET&hours=6" >/dev/null
```

Safe to run as often as you like — fulfilment is idempotent, so a sweep over settled
payments only reads. Run it by hand after any incident:

```bash
curl -s "https://tier2rising.com/api/payment/reconcile?secret=...&hours=48" | python3 -m json.tool
```

```jsonc
{
  "repaired":    [],   // payments this run rescued — should normally be empty
  "stillBroken": [],   // MUST be empty. Anything here is owed money. See section 8.
  "journal":     { "pending": 3, "fulfilled": 41, "fulfil_failed": 0, "total": 44 }
}
```

`pending` records are just abandoned checkouts — no money moved, ignore them.

---

## 8. When a customer pays but is not registered

You will know because `MAIL_ORGANISER` receives:

> **ACTION REQUIRED — paid but NOT recorded: <name> (₹499)**

The email carries everything needed: amount, payment id, order id, timestamp, and the
full registration. **The customer's money is with us and their seat is not booked.**

1. **Try the automatic fix first** — the sweep retries the sheet write:
   ```bash
   curl -s "https://tier2rising.com/api/payment/reconcile?secret=...&hours=24" | python3 -m json.tool
   ```
   If the order moves into `repaired`, it is done and the receipt has gone out.

2. **If it stays in `stillBroken`**, find the cause — nearly always the Apps Script
   endpoint:
   ```bash
   pm2 logs tier2rising --lines 200 | grep '\[payments\]'
   curl -s "$NEXT_PUBLIC_REGISTRATION_ENDPOINT"   # expect {"ok":true,...,"forms":[...]}
   ```
   An HTML response means the Apps Script deployment is not public, or a code change was
   never deployed as a **New version**.

3. **Add the row by hand** from the email, then reply to the customer directly.

4. Nothing is ever lost while you work: the payload is on the Razorpay order's `notes`,
   searchable in the dashboard by payment id.

**There is no auto-refund path, deliberately.** Refunding is a judgement call with
accounting consequences, and the data is safe in two places, so nothing is gained by
having a machine make that decision at 2am.

---

## 9. Going live

Work through this in order.

- [ ] End-to-end test on the server with **test** keys: pay, receive the receipt, see
      the row appear in the Sheet with `Payment Status = Paid`.
- [ ] Close the tab immediately after paying and confirm the **webhook** still registers
      you. This is the single most important test here.
- [ ] Confirm `pm2 describe` shows **fork mode, 1 instance**.
- [ ] Confirm `journal.writable` is `true` and the path is absolute.
- [ ] `RAZORPAY_WEBHOOK_SECRET` and `PAYMENT_RECONCILE_SECRET` both set.
- [ ] Reconciliation cron installed and its first run seen in the logs.
- [ ] Swap `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` for `rzp_live_…`, then **create a
      new webhook** in live mode — dashboard webhooks do not carry over from test.
- [ ] `npm run build && pm2 restart tier2rising`, then confirm `"mode":"LIVE"`.
- [ ] Make one real payment of the real amount, confirm the receipt has **no test-mode
      banner**, then refund yourself from the dashboard.
- [ ] Drop `MAX_PER_WINDOW` in `src/lib/submission.ts` from 50 back to ~5. It was raised
      for testing; at 50/hour one IP can burn a third of the Brevo daily quota.
- [ ] Decide what to do about the advertised seat counts (see the warning in section 3).
- [ ] Buy one of **each** of the three passes in test mode and confirm the receipt and
      the Sheet row both name the right ticket.

### Rolling back

Set `REGISTRATION_PAYMENT_ENABLED=0`, rebuild, restart. `/api/payment/order` then
returns 404 and the ticket buttons stop working. The registration form is unaffected —
it is already free — so the site still captures leads through the waitlist. Payments
already captured are unaffected and can still be settled by the reconcile sweep.

---

## 10. Things worth knowing

**Razorpay's idempotency header does not work on Orders.** `x-razorpay-idempotency` is a
RazorpayX Payouts feature; the Orders API ignores it. Verified against the live test
API — two POSTs with an identical key returned two different orders. Deduplication is
therefore ours: `/api/payment/order` reuses an existing **unpaid** order for the same
payer, amount and 5-minute bucket. Do not "simplify" this by trusting the header.

**A valid signature is not proof of payment.** It proves a message came from Razorpay,
not that money moved. `/verify` always re-fetches the payment from the API and checks
status, amount and order id before fulfilling. The webhook is allowed to trust its
signed entity, because the HMAC there covers the raw body from Razorpay itself.

**The customer never sees a failure after being charged.** Once money is captured every
response is a success, with wording that varies by how much of the backend succeeded. A
person who is charged and then shown an error will pay again, and refunding a duplicate
is a far worse afternoon than a softer message plus an internal alert.

**The paid receipt is a different template from the approved waitlist email.** The
client-approved registrant email says "ticketing isn't live yet" — true on a waitlist,
alarming to somebody holding a receipt. `src/lib/email/paid.ts` uses the same shell and
palette with correct copy plus the receipt panel. **It has not been through client
sign-off yet.** It carries a test-mode banner while the keys are `rzp_test_…`, which
disappears on live keys.

**The rate limit is in-memory**, so it resets on restart and is per-process. Fine for a
single fork-mode instance; revisit alongside the journal if you ever scale out.
