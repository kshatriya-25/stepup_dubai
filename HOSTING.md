# Hosting — tier2rising.com

Complete deployment guide for the Tier-2 Rising summit site on the shared box
`vmi1314728`, which already serves other Apache vhosts and already runs three other
PM2 apps. Nothing in here should disturb them.

---

## What changed, and why

The site **used to be** a static export: `next build` emitted `out/`, that was rsynced
to `/var/www/tier2expo/expo-public`, and Apache served the files directly. No Node, no
PM2, no proxy.

That stopped being possible when registration emails were added. Two hard reasons:

1. **A static export cannot run a route handler.** `output: 'export'` and
   `/api/register` are mutually exclusive.
2. **The SMTP password must never reach the browser.** In a static build the only way
   to get a value into the page is `NEXT_PUBLIC_*`, which inlines it into public
   JavaScript. That would publish the password and let anyone on the internet send
   mail as `tier2rising.com`.

So the site is now a **Node process behind an Apache reverse proxy**. Images, the hero
video and Next's hashed assets are still served by Apache straight off disk — only
HTML and `/api/*` actually touch Node.

```
Browser ──▶ Apache :443 ──┬── /logos /posters /happens /video /brand → disk (immutable)
                          ├── /_next/static                          → disk (immutable)
                          └── everything else                        → proxy → Node :3211
                                                                                  │
                                            registration ──┬──▶ Apps Script ──▶ Google Sheet
                                                           ├──SMTP──▶ participant email
                                                           └──SMTP──▶ organiser email
```

**The TLS certificate does not change.** It is already issued for `tier2rising.com` and
`www.tier2rising.com`, and the domain isn't moving, so **certbot does not need to run
again**. The two vhost files are edited in place and the `SSLCertificateFile` lines stay
exactly as they are.

---

## Before you start: two values to determine

The vhost hardcodes a repo path and a port as `Define` lines. Both must be right or the
site 502s.

```bash
# 1. Where does `npm run build` run? That directory must contain package.json,
#    and after a build, .next/ and public/.
ls -d /var/www/tier2expo/*/
ls /var/www/tier2expo/stepup_dubai/package.json

# 2. Is port 3211 free? Three PM2 apps already hold ports on this box.
ss -tlnp | grep -E '3211|node'

# 3. The server's public IP — Brevo needs it allowlisted (next section).
curl -s ifconfig.me
```

Whatever (1) returns is your `REPO`. Whatever port is free is your `PORT`. Both appear
at the top of the `:443` vhost below.

> The old docroot `/var/www/tier2expo/expo-public` stops being served once the proxy is
> in. **Leave it in place** until the new setup is confirmed — it's what the rollback
> falls back to.

---

## Step 1 — Brevo account setup

Do this first. It's the current blocker and it's pure account config, no code.

### 1a. Authorise the server's IP ⚠️

A test authentication against Brevo was rejected with:

```
525 5.7.1 Unauthorized IP address
```

The account has **Authorised IPs** switched on, so only allowlisted IPs may send.

Brevo → **Account (top-right) → Security → Authorised IPs** → add the IP from
`curl -s ifconfig.me`. Add your office/laptop IP too if you want to test locally.

### 1b. Verify the sending domain

Mail sends from `info@tier2rising.com`, so **tier2rising.com** must be verified in
Brevo → **Senders, Domains & Dedicated IPs → Domains**. That means adding Brevo's
DKIM/DMARC records to the domain's DNS.

Skip this and Gmail/Outlook spam-folder or reject everything.

Full detail and troubleshooting: [`EMAIL-SETUP.md`](EMAIL-SETUP.md).

---

## Step 2 — Pull the code and create `.env`

```bash
cd /var/www/tier2expo/stepup_dubai     # your REPO from above
git pull
nano .env
chmod 600 .env
```

`.env` is gitignored, so `git pull` will never deliver it — it must be created on the
box by hand. This is the only place the SMTP password lives.

```bash
NEXT_PUBLIC_REGISTRATION_ENDPOINT=https://script.google.com/macros/s/AKfy…/exec
NEXT_PUBLIC_REGISTRATION_OPEN=1
NEXT_PUBLIC_SITE_URL=https://tier2rising.com

SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=b4a1a5001@smtp-brevo.com
SMTP_PASS=xsmtpsib-…

MAIL_FROM=info@tier2rising.com
MAIL_FROM_NAME=Tier-2 Rising Startup Summit
MAIL_REPLY_TO=info@tier2rising.com
MAIL_ORGANISER=info@tier2rising.com
```

**Never rename any `SMTP_*` or `MAIL_*` key with a `NEXT_PUBLIC_` prefix.** That prefix
is exactly what would leak the password into the browser bundle.

Also confirm `next.config.mjs` has **no `output: 'export'`**. If someone re-adds it,
`/api/register` stops existing and every registration silently fails.

---

## Step 3 — Build

```bash
npm ci
npm run build
```

Zero impact on the live site so far — it's still being served off the old static
docroot. If the build fails, stop here; nothing has changed.

---

## Step 4 — Start Node under PM2

PM2 is already installed and running three apps. Add a fourth without touching them:

```bash
cd /var/www/tier2expo/stepup_dubai
pm2 start "npx next start -p 3211" --name tier2rising
pm2 save
```

`pm2 startup` is already configured on this box for the existing apps, so `pm2 save` is
enough to make the new one survive a reboot.

---

## Step 5 — Prove Node works before Apache touches it

```bash
curl -s localhost:3211/api/register
```

Must return:

```json
{"ok":true,"service":"tier2-rising-registrations","sheet":"configured","mail":"configured","organiser":["info@tier2rising.com"]}
```

If either field says `NOT CONFIGURED`, a `.env` key is missing. If nothing answers at
all, `pm2 logs tier2rising`.

**Do not skip this.** Swapping the vhost first would give you a 502 that tells you
nothing about which half is broken.

---

## Step 6 — Enable the proxy modules

```bash
a2enmod proxy proxy_http
systemctl restart apache2
```

`proxy` and `proxy_http` are the only new ones — `headers`, `expires`, `deflate`,
`http2` and `ssl` are already on. Enabling a module does not alter other vhosts'
behaviour.

---

## Step 7 — Swap the vhosts

This is the only visitor-facing step, and the only one that needs undoing if something
is wrong. Back up first.

```bash
cp /etc/apache2/sites-available/tier2rising.com.conf        ~/tier2rising.com.conf.bak
cp /etc/apache2/sites-available/tier2rising.com-le-ssl.conf ~/tier2rising.com-le-ssl.conf.bak

cd /var/www/tier2expo/stepup_dubai
cp deploy/tier2rising.com.conf        /etc/apache2/sites-available/tier2rising.com.conf
cp deploy/tier2rising.com-le-ssl.conf /etc/apache2/sites-available/tier2rising.com-le-ssl.conf

nano /etc/apache2/sites-available/tier2rising.com-le-ssl.conf   # set Define REPO / PORT

apachectl configtest        # must print: Syntax OK — do NOT reload otherwise
systemctl reload apache2    # reload, not restart — no dropped connections
```

Both sites are already enabled, so no `a2ensite` is needed.

The file contents are reproduced in full at the bottom of this document.

### What changed in them, and why

| Directive | Change | Reason |
|---|---|---|
| `ProxyPass / http://127.0.0.1:3211/` | added | Node now renders the HTML and runs `/api/register` |
| `Alias` for `/logos`, `/video`, `/_next/static`, … | added | keeps images and the 2.7 MB hero video off the Node process |
| `DirectoryIndex index.html` | removed | there is no `index.html` on disk any more |
| `ErrorDocument 404 /404.html` | removed | Next renders its own 404 |
| `<FilesMatch "\.html$">` no-cache | removed | no `.html` served off disk; Next sets its own headers |
| `Cache-Control: no-store` on `/api/` | added | registrations must never be cached |
| `ProxyTimeout 60` | added | gives the SMTP round-trip room to finish |
| `<FilesMatch "^\.env">` denial | added | belt-and-braces; the file holds the SMTP password |
| ACME carve-out on `:80` | added | `certbot renew` must reach `/.well-known/` over HTTP, unredirected and unproxied |
| `.git` denial, hardening, compression, asset caching | **kept as-is** | still correct |
| SSL certificate lines | **kept as-is** | same domain, same certificate |

---

## Step 8 — Verify

```bash
curl -I https://tier2rising.com/                 # 200
curl -I https://tier2rising.com/logos/sidbi.png  # 200, immutable, served by Apache
curl -I https://tier2rising.com/video/hero.mp4   # 200, immutable
curl -s https://tier2rising.com/api/register     # sheet + mail both "configured"
certbot renew --dry-run                          # confirms ACME is still reachable
```

In the browser: hero video autoplays (muted), Network → Protocol column reads `h2`.

Then submit **one real registration** through the form and confirm all three:

1. the row lands in the Google Sheet,
2. the participant confirmation email arrives,
3. the organiser notification arrives at `info@tier2rising.com`.

---

## Rollback

```bash
cp ~/tier2rising.com-le-ssl.conf.bak /etc/apache2/sites-available/tier2rising.com-le-ssl.conf
cp ~/tier2rising.com.conf.bak        /etc/apache2/sites-available/tier2rising.com.conf
apachectl configtest && systemctl reload apache2
```

This restores the old static site immediately — **but only while
`/var/www/tier2expo/expo-public` still holds the last static build.** Don't delete that
directory until you've been live and happy for several days.

To also stop the Node process: `pm2 delete tier2rising && pm2 save`.

---

## Redeploy after a code change

```bash
cd /var/www/tier2expo/stepup_dubai
git pull
npm ci
npm run build
pm2 restart tier2rising
```

No Apache reload needed. `.env` is not in git — if you changed it, edit it on the box
and restart PM2, since env vars are read at process start.

---

## Troubleshooting

**502 Bad Gateway** — Node isn't running, or `Define PORT` doesn't match the port PM2
started it on. `pm2 status`, `pm2 logs tier2rising`, `ss -tlnp | grep 3211`.

**Everything 404s, or a blank page** — `Define REPO` points at a directory with no
`.next/`. The build didn't run there.

**404s on images only** — an `Alias` path is wrong (check `Define REPO`), or Apache
can't read `public/`. Confirm with `curl -I https://tier2rising.com/logos/sidbi.png`
and read `/var/log/apache2/tier2rising_error.log`.

**Registration fails with "we could not save your registration"** — the Apps Script
write failed. `pm2 logs tier2rising` will show `[register] sheet append failed:` with
the real reason. Usually the Apps Script deployment's *Who has access* isn't **Anyone**.

**Response says `"mailed":false`** — the Sheet row was written but the participant
confirmation didn't send. `pm2 logs tier2rising | grep "mail failed"` gives Brevo's own
error text; it's usually the IP allowlist. The registration itself is safe.

**You changed code but the old behaviour persists** — `npm ci` does not rebuild.
The redeploy sequence is **pull → install → build → restart**, and skipping the build
is silent: `next start` just keeps serving the previous `.next/`. Verify what's actually
live by grepping the served HTML for something you changed.

**Registration succeeds but no email arrives** — almost certainly the Brevo IP
allowlist (step 1a). `pm2 logs tier2rising` shows
`[register] participant mail failed:` with Brevo's own error text. Full table in
[`EMAIL-SETUP.md`](EMAIL-SETUP.md).

**Certificate renewal fails** — the ACME carve-out is missing from the `:80` vhost, or
`/.well-known/acme-challenge` is being proxied to Node. Test with
`certbot renew --dry-run`.

**A change didn't take** — you rebuilt but didn't `pm2 restart`. The running process
still holds the old build.

**`EADDRINUSE`** — something already holds the port. `ss -tlnp | grep 3211`, then pick
a different `Define PORT` and match it in the `pm2 start` command.

**Hero video doesn't play** — it's `muted autoplay loop playsinline`; browsers only
autoplay muted video. Confirm `/video/hero.mp4` returns `200 video/mp4`.

---
---

# Appendix — the two vhost files in full

Both are version-controlled in [`deploy/`](deploy/), so the server config doesn't exist
only on the box. Copy them from there rather than retyping.

## `/etc/apache2/sites-available/tier2rising.com.conf`

```apache
<VirtualHost *:80>
    ServerName tier2rising.com
    ServerAlias www.tier2rising.com

    DocumentRoot /var/www/html

    # Keep ACME challenges on HTTP and off the proxy.
    Alias /.well-known/acme-challenge /var/www/html/.well-known/acme-challenge
    <Directory /var/www/html/.well-known/acme-challenge>
        Options -Indexes
        Require all granted
    </Directory>

    RewriteEngine on
    RewriteCond %{REQUEST_URI} !^/\.well-known/acme-challenge/
    RewriteCond %{SERVER_NAME} =www.tier2rising.com [OR]
    RewriteCond %{SERVER_NAME} =tier2rising.com
    RewriteRule ^ https://%{SERVER_NAME}%{REQUEST_URI} [END,NE,R=permanent]

    ErrorLog  ${APACHE_LOG_DIR}/tier2rising_error.log
    CustomLog ${APACHE_LOG_DIR}/tier2rising_access.log combined
</VirtualHost>
```

## `/etc/apache2/sites-available/tier2rising.com-le-ssl.conf`

**Set the two `Define` lines at the top before enabling.**

```apache
Define REPO /var/www/tier2expo/stepup_dubai
Define PORT 3211

<IfModule mod_ssl.c>
<VirtualHost *:443>
    ServerName tier2rising.com
    ServerAlias www.tier2rising.com

    # Only a fallback for the Alias rules below; Next serves the real pages.
    DocumentRoot ${REPO}/public

    Protocols h2 http/1.1

    # --- static off disk, never through Node --------------------------------
    Alias /_next/static ${REPO}/.next/static
    Alias /logos        ${REPO}/public/logos
    Alias /posters      ${REPO}/public/posters
    Alias /happens      ${REPO}/public/happens
    Alias /brand        ${REPO}/public/brand
    Alias /video        ${REPO}/public/video

    <Directory ${REPO}/public>
        Options -Indexes +FollowSymLinks
        AllowOverride None
        Require all granted
    </Directory>
    <Directory ${REPO}/.next/static>
        Options -Indexes +FollowSymLinks
        AllowOverride None
        Require all granted
    </Directory>

    # --- deny VCS metadata --------------------------------------------------
    # The docroot sits inside a git checkout; scanners actively probe /.git/config.
    <DirectoryMatch "/\.git">
        Require all denied
    </DirectoryMatch>
    <FilesMatch "^\.git">
        Require all denied
    </FilesMatch>
    # .env holds the SMTP password. It sits outside DocumentRoot, but deny it by
    # name too — a future Alias or symlink must not be able to expose it.
    <FilesMatch "^\.env">
        Require all denied
    </FilesMatch>

    # --- proxy the rest to Next ---------------------------------------------
    ProxyPreserveHost On
    ProxyPass        /_next/static !
    ProxyPass        /logos !
    ProxyPass        /posters !
    ProxyPass        /happens !
    ProxyPass        /brand !
    ProxyPass        /video !
    ProxyPass        /.well-known/acme-challenge !
    ProxyPass        / http://127.0.0.1:${PORT}/
    ProxyPassReverse / http://127.0.0.1:${PORT}/

    # Registrations post through here; give the SMTP round-trip room to finish.
    ProxyTimeout 60

    # --- caching -------------------------------------------------------------
    # Images, logos and the hero video are content-stable: cache hard.
    <LocationMatch "^/(logos|posters|happens|video|brand)/">
        Header set Cache-Control "public, max-age=31536000, immutable"
    </LocationMatch>

    # Next's build assets are content-hashed -> immutable.
    <LocationMatch "^/_next/static/">
        Header set Cache-Control "public, max-age=31536000, immutable"
    </LocationMatch>

    # The registration endpoint must never be cached by anything.
    <LocationMatch "^/api/">
        Header set Cache-Control "no-store"
    </LocationMatch>

    # NOTE: the old `<FilesMatch "\.html$">` no-cache rule is gone — no .html files
    # are served off disk any more. Next sets its own headers on HTML.
    # `ErrorDocument 404 /404.html` and `DirectoryIndex index.html` are gone for the
    # same reason: Next renders its own 404.

    # --- compression ---------------------------------------------------------
    # Text only. Never gzip the mp4 or the JPEGs.
    AddOutputFilterByType DEFLATE text/html text/css application/javascript \
                                  application/json image/svg+xml text/plain

    # --- hardening -----------------------------------------------------------
    Header always set X-Content-Type-Options "nosniff"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set X-Frame-Options "SAMEORIGIN"

    ErrorLog  ${APACHE_LOG_DIR}/tier2rising_error.log
    CustomLog ${APACHE_LOG_DIR}/tier2rising_access.log combined

Include /etc/letsencrypt/options-ssl-apache.conf
SSLCertificateFile /etc/letsencrypt/live/tier2rising.com/fullchain.pem
SSLCertificateKeyFile /etc/letsencrypt/live/tier2rising.com/privkey.pem
</VirtualHost>
</IfModule>
```
