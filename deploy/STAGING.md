# staging.tier2rising.com

A second copy of the same site, on the same box, under the same pm2 — a different
port, a different vhost, a different `.env`.

| | production | staging |
|---|---|---|
| repo | `/var/www/tier2expo/stepup_dubai` | `/var/www/tier2expo/staging/tier2` |
| port | `3211` | `3212` |
| pm2 name | `tier2rising` | `tier2rising-staging` |
| vhost | `deploy/tier2rising.com*.conf` | `deploy/staging.tier2rising.com*.conf` |
| logs | `tier2rising_*.log` | `tier2staging_*.log` |

Everything else — Apache, Node, pm2 — is shared. Nothing about the production site
changes when you follow this; you never touch its vhost, its port or its process.

---

## Step 1 — DNS

Add an **A record** for `staging` pointing at the same IP as `tier2rising.com`.
Confirm it has propagated before going near certbot, which will simply fail
otherwise:

```bash
dig +short staging.tier2rising.com
```

Must print the server's IP. If it prints nothing, wait — do not continue.

---

## Step 2 — Confirm the port is free

```bash
ss -tlnp | grep -E '3211|3212'
```

You should see **3211 only** (production). If something already holds 3212, pick
another and change it in BOTH the vhost (`Define STAGING_PORT`) and the `pm2 start`
command in step 5.

---

## Step 3 — Certificate first, then the SSL vhost

Apache will not start if a vhost references a certificate file that does not exist,
and a failed start takes **production down with it**. So the order here is not
optional: port-80 vhost, then certbot, then the 443 vhost.

```bash
sudo cp /var/www/tier2expo/staging/tier2/deploy/staging.tier2rising.com.conf \
        /etc/apache2/sites-available/
sudo a2ensite staging.tier2rising.com.conf
sudo apache2ctl configtest && sudo systemctl reload apache2

sudo certbot certonly --webroot -w /var/www/html -d staging.tier2rising.com
```

`certonly` is deliberate — it fetches the certificate without letting certbot
rewrite your vhosts. Confirm it landed:

```bash
sudo ls /etc/letsencrypt/live/staging.tier2rising.com/fullchain.pem
```

Only once that file exists:

```bash
sudo cp /var/www/tier2expo/staging/tier2/deploy/staging.tier2rising.com-le-ssl.conf \
        /etc/apache2/sites-available/
sudo a2ensite staging.tier2rising.com-le-ssl.conf
sudo apache2ctl configtest
```

`configtest` must say **Syntax OK** before you reload. Do not skip it — a typo here
reloads into a broken Apache and both sites go down together.

---

## Step 4 — The staging `.env`

**This is the step that actually matters.** The repo is a copy, so `.env` starts as
a copy too, and a copied `.env` points staging at production's money, production's
spreadsheet and production's inbox.

Change these seven, at minimum:

```bash
# --- identity -------------------------------------------------------------
NEXT_PUBLIC_SITE_URL=https://staging.tier2rising.com

# --- payments: TEST KEYS ONLY, NEVER rzp_live_ ----------------------------
# A live key here means a real card is charged by whoever is clicking around
# staging to check a font size.
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx

# --- the payment journal MUST NOT be shared -------------------------------
# Two Node processes appending to one file is how the crash-safe record stops
# being either. Absolute path, and a different one from production's.
PAYMENT_JOURNAL_PATH=/var/www/tier2expo/staging/tier2/data/payments.jsonl

# --- notifications: send to yourself, not the client ----------------------
# Every click-through on staging fires these. Left pointing at the client, a
# morning of testing arrives in their inbox as a dozen fake registrations.
MAIL_ORGANISER=you@tealorca.in
MAIL_PARTNER_ORGANISER=you@tealorca.in

# --- the Google Sheet -----------------------------------------------------
# Left as-is, staging test rows land in the REAL Registrations tab, mixed in
# with genuine attendees and indistinguishable from them afterwards. Point this
# at a second Apps Script deployment on a copy of the Sheet.
NEXT_PUBLIC_REGISTRATION_ENDPOINT=https://script.google.com/macros/s/<STAGING_ID>/exec
```

Then create the journal directory and make sure the pm2 user owns it:

```bash
mkdir -p /var/www/tier2expo/staging/tier2/data
```

If `/api/payment/order` later returns 503, this directory is the first thing to
check — the app refuses to take money it cannot record.

**Leave `RAZORPAY_WEBHOOK_SECRET` empty on staging** unless you have registered a
*separate* webhook pointing at `staging.tier2rising.com`. Never point the
production webhook at staging: Razorpay would deliver real payment events to the
staging process, which would then fulfil them against the staging journal and the
staging sheet, and the real registration would never be recorded.

---

## Step 5 — Build and start

```bash
cd /var/www/tier2expo/staging/tier2
npm ci
npm run build
pm2 start "npx next start -p 3212" --name tier2rising-staging
pm2 save
```

`pm2 save` rewrites the saved process list, so it now contains **both** apps and
both survive a reboot. `pm2 startup` is already configured on this box.

Prove Node is up before Apache touches it:

```bash
curl -s localhost:3212/api/payment/order | head -c 200
```

A JSON body means it is running. A connection refused means it is not, and no
amount of Apache configuration will help.

---

## Step 6 — Reload Apache

```bash
sudo apache2ctl configtest && sudo systemctl reload apache2
```

`reload`, not `restart` — reload picks up the new config without dropping the
connections production is currently serving.

---

## Step 7 — Verify

```bash
curl -sI https://staging.tier2rising.com/ | head -20
```

Look for:

- `HTTP/2 200`
- `x-robots-tag: noindex, nofollow, noarchive` — staging is invisible to Google
- a valid certificate (no `curl` TLS warning)

Then confirm the two sites are genuinely independent:

```bash
curl -s https://tier2rising.com/api/payment/order         | python3 -m json.tool | grep -E 'mode|path'
curl -s https://staging.tier2rising.com/api/payment/order | python3 -m json.tool | grep -E 'mode|path'
```

The `journal.path` values must differ. If they match, stop and fix `.env` — you
have two processes writing one payment journal.

---

## Deploying to staging afterwards

```bash
cd /var/www/tier2expo/staging/tier2
git pull
npm ci
npm run build
pm2 restart tier2rising-staging --update-env
```

Identical to production apart from the pm2 name. Production is untouched by this;
its process keeps serving the old build until you deploy it separately.

---

## If Apache will not start

`sudo apache2ctl configtest` names the file and line. The two that actually happen:

**`SSLCertificateFile: file does not exist`** — the 443 vhost was enabled before
certbot ran. `sudo a2dissite staging.tier2rising.com-le-ssl.conf`, reload, do step 3
properly.

**`.next/static` directory not found** — Apache was reloaded before the first
`npm run build`. Build, then reload.

Both take production down while they persist, because Apache is one process serving
both sites. That is the price of the shared box, and the reason `configtest` comes
before every reload in this document.
