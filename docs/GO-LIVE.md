# Going live with real payments

Everything below is `.env` and ops. No code changes are needed to open the till —
`TICKET_SALES_LIVE` in `src/content/tickets.ts` is already `true`.

Read this in order. Step 1 is on staging on purpose: test keys and live keys are
not the same system, and the only way to find out whether the **account** works is
to push one real payment through it.

---

## 0 — Two blockers on production, fix these first

Both are currently wrong in the production `.env` and both cost paid
registrations the moment money starts moving.

### `RAZORPAY_WEBHOOK_SECRET` is empty

The webhook is the recovery path for the customer who pays and then closes the tab
before the browser can call `/api/payment/verify`. With no secret,
`verifyWebhookSignature()` rejects **every** delivery, so that customer's money is
captured and their registration is never recorded.

1. Razorpay dashboard → Settings → Webhooks → **Add New Webhook**
2. URL `https://tier2rising.com/api/payment/webhook`
3. Active events: `payment.captured`, `payment.failed`, `order.paid`
4. Secret: `openssl rand -hex 32`, paste the same value into the dashboard and
   into the production `.env`.

### `PAYMENT_JOURNAL_PATH` is relative

```bash
# WRONG — resolves against pm2's cwd, which is wherever pm2 was first started
PAYMENT_JOURNAL_PATH=./data/payments.jsonl

# RIGHT
PAYMENT_JOURNAL_PATH=/var/www/tier2expo/stepup_dubai/data/payments.jsonl
```

`pm2 restart` keeps the original cwd, so a relative path means the journal — and
now `leads.jsonl`, which is written beside it — end up somewhere nobody looks.

```bash
mkdir -p /var/www/tier2expo/stepup_dubai/data
```

---

## 1 — Smoke-test the live keys on staging, at ₹2

**On `/var/www/tier2expo/staging/tier2/.env`:**

```bash
REGISTRATION_PAYMENT_ENABLED=1

RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx

# Its OWN webhook, pointing at staging. Never point production's here.
RAZORPAY_WEBHOOK_SECRET=<a second, different random string>

# Rewrites every paid pass to ₹2 — base price and per-extra-member price both.
TICKET_PRICE_OVERRIDE_INR=2
```

Register a second webhook in the Razorpay dashboard at
`https://staging.tier2rising.com/api/payment/webhook` with that second secret.
Skipping it means the close-the-tab path is the one thing you never tested.

```bash
cd /var/www/tier2expo/staging/tier2
git pull && npm ci && npm run build && pm2 restart tier2rising-staging
```

Confirm what the box will actually charge:

```bash
curl -s https://staging.tier2rising.com/api/payment/order | python3 -m json.tool
```

```json
{ "ok": true, "enabled": true, "mode": "LIVE",
  "testPricing": "₹2 per pass",
  "tickets": [ { "id": "delegate", "price": "₹2" }, ... ],
  "journal": { "writable": true, "path": "/var/www/tier2expo/staging/..." } }
```

`mode: "LIVE"` with `testPricing: false` on staging means the override was
refused — check the pm2 log, it says why.

### What to actually test

| # | Test | What it proves |
|---|---|---|
| 1 | Buy a Delegate Pass with a real UPI app | Live keys work end to end |
| 2 | Buy an Investor Pitch Pass **with 2 extra members** | ₹6 charged, not ₹2 — extras price correctly |
| 3 | Pay, then **close the tab** before the success screen | The webhook fulfils it |
| 4 | Start a payment and cancel it | `payment.failed`, no journal row marked paid |
| 5 | Check the receipt email | Red *"STAGING TEST"* banner is present |
| 6 | Check the sheet row | Pass type, amount, Paid At in IST |

Every one of those charges real money. **Refund all of them**: Razorpay dashboard
→ Transactions → Payments → Refund. An unrefunded ₹2 sits in the settlement report
as a sale with no attendee behind it.

### Then put staging back

```bash
# staging .env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx
# TICKET_PRICE_OVERRIDE_INR=2   <- delete or comment out
```

```bash
npm run build && pm2 restart tier2rising-staging
```

Staging left on live keys is a live gateway nobody is watching.

---

## 2 — Open the till on production

**On `/var/www/tier2expo/stepup_dubai/.env`:**

```bash
REGISTRATION_PAYMENT_ENABLED=1

RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=<the secret from step 0>

PAYMENT_JOURNAL_PATH=/var/www/tier2expo/stepup_dubai/data/payments.jsonl
```

**`TICKET_PRICE_OVERRIDE_INR` must not appear in this file.** If it does it will be
ignored — `isProductionSite` is compiled into the production build from the
hard-coded origin in `src/lib/site-env.ts`, so no environment variable can turn
test pricing on here — but leave it out anyway. A line that looks like it works is
a line someone will trust.

```bash
cd /var/www/tier2expo/stepup_dubai
git pull && npm ci && npm run build && pm2 restart tier2rising
```

### Verify

```bash
curl -s https://tier2rising.com/api/payment/order | python3 -m json.tool
```

Must read:

```json
{ "ok": true, "enabled": true, "mode": "LIVE", "testPricing": false,
  "tickets": [ { "id": "free",            "price": "Free"   },
               { "id": "delegate",        "price": "₹299"   },
               { "id": "workshop",        "price": "₹999"   },
               { "id": "investor-pitch",  "price": "₹2,999" } ],
  "journal": { "writable": true, "path": "/var/www/tier2expo/stepup_dubai/data/payments.jsonl" } }
```

If `testPricing` is anything but `false`, or a price is not the figure above,
**stop and fix `.env` before announcing.**

Then check the registration side is healthy too:

```bash
curl -s https://tier2rising.com/api/register | python3 -m json.tool
# leadLog.writable must be true — the lead log is the record, the Sheet is a projection
```

And buy one real Delegate Pass yourself, ₹299, then refund it. It is the only way
to know the production keys and the production webhook are both wired.

---

## 3 — Cron

Both sweeps, alongside each other. `PAYMENT_RECONCILE_SECRET` guards both.

```cron
*/15 * * * * curl -fsS "https://tier2rising.com/api/payment/reconcile?secret=$SECRET" >/dev/null
*/15 * * * * curl -fsS "https://tier2rising.com/api/register/replay?secret=$SECRET"  >/dev/null
```

The second one is separate on purpose: `/reconcile` refuses to run while payments
are disabled, which is exactly when waitlist leads are the only submissions there
are.

---

## Switch reference

| Switch | Where | What it decides |
|---|---|---|
| `TICKET_SALES_LIVE` | `src/content/tickets.ts` (code) | The shopfront. `false` = "booking opens soon". Currently `true`. |
| `REGISTRATION_PAYMENT_ENABLED` | server `.env` | The till. `1` = charge; anything else = the same forms in waitlist mode. |
| `RAZORPAY_KEY_ID` prefix | server `.env` | `rzp_live_` = real money. `rzp_test_` stamps *"TEST MODE — no real money was charged"* on the receipt. |
| `TICKET_PRICE_OVERRIDE_INR` | staging `.env` only | Test pricing, 1–100 rupees. Ignored on production. See `src/lib/pricing.ts`. |
| `isFreePass()` | derived | A ₹0 pass never reaches Razorpay under any of the above. |
