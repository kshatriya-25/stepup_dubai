# Hosting — expo.tier2rising.com (Apache + Node)

Deploying the Tier-2 Rising summit site onto the existing Apache box
(`/var/www/tier2expo/stepup_dubai`) that already serves other vhosts.

> **This changed.** The site used to be a 100% static export that Apache served
> straight off disk. Adding registration emails required a server: the SMTP password
> must never reach the browser, and `output: 'export'` cannot run a route handler.
> The site is now a **Node process behind an Apache reverse proxy**. Images, the hero
> video and Next's hashed assets are still served directly by Apache off disk, so only
> HTML and `/api/*` actually touch Node.

```
Browser ──▶ Apache :443 ──┬── /logos /posters /happens /video  → disk (immutable cache)
                          ├── /_next/static                    → disk (immutable cache)
                          └── everything else                  → proxy → Node :3211
```

---

## 1. Config (already in the repo — verify after pull)

`next.config.mjs` must contain:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  images: { unoptimized: true },     // plain <img> everywhere — optimizer buys nothing
  trailingSlash: true,
  skipTrailingSlashRedirect: true,   // so POST /api/register isn't bounced via a redirect
}
export default nextConfig
```

There must be **no `output: 'export'`**. If someone re-adds it, `/api/register` stops
existing and every registration silently fails.

## 2. Secrets on the server

`.env` is gitignored, so `git pull` will never deliver it. Create it once on the box
and keep it out of the repo:

```bash
cd /var/www/tier2expo/stepup_dubai
cp /path/to/your/.env .env        # or write it by hand
chmod 600 .env
chown www-data:www-data .env
```

Required keys are listed in [`EMAIL-SETUP.md`](EMAIL-SETUP.md). **Also do the two
Brevo account steps in that doc** — the server's public IP must be allowlisted, and
`tier2rising.com` must be a verified sending domain, or no mail goes out.

## 3. Build

```bash
cd /var/www/tier2expo/stepup_dubai
git pull
npm ci
npm run build
```

## 4. Run it under PM2

```bash
npm i -g pm2
pm2 start "npx next start -p 3211" --name expo-tier2
pm2 save && pm2 startup      # run the command it prints, so it survives reboot
```

Pick a free port if 3211 is taken: `ss -tlnp | grep 3211`.

Verify Node is actually up before touching Apache:

```bash
curl -s localhost:3211/api/register     # → {"ok":true,...,"mail":"configured"}
```

## 5. Enable the modules

```bash
a2enmod headers expires deflate http2 ssl proxy proxy_http
systemctl restart apache2
```

## 6. Vhost

`/etc/apache2/sites-available/expo.tier2rising.com.conf`

```apache
<VirtualHost *:80>
    ServerName expo.tier2rising.com
    Redirect permanent / https://expo.tier2rising.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName expo.tier2rising.com
    DocumentRoot /var/www/tier2expo/stepup_dubai/public

    Protocols h2 http/1.1

    # --- static off disk, never through Node --------------------------------
    Alias /_next/static /var/www/tier2expo/stepup_dubai/.next/static
    Alias /logos        /var/www/tier2expo/stepup_dubai/public/logos
    Alias /posters      /var/www/tier2expo/stepup_dubai/public/posters
    Alias /happens      /var/www/tier2expo/stepup_dubai/public/happens
    Alias /brand        /var/www/tier2expo/stepup_dubai/public/brand
    Alias /video        /var/www/tier2expo/stepup_dubai/public/video

    <Directory /var/www/tier2expo/stepup_dubai/public>
        Options -Indexes +FollowSymLinks
        Require all granted
    </Directory>
    <Directory /var/www/tier2expo/stepup_dubai/.next/static>
        Options -Indexes +FollowSymLinks
        Require all granted
    </Directory>

    # --- proxy the rest to Next ---------------------------------------------
    ProxyPreserveHost On
    ProxyPass        /_next/static !
    ProxyPass        /logos !
    ProxyPass        /posters !
    ProxyPass        /happens !
    ProxyPass        /brand !
    ProxyPass        /video !
    ProxyPass        / http://127.0.0.1:3211/
    ProxyPassReverse / http://127.0.0.1:3211/

    # --- caching -------------------------------------------------------------
    # Images, logos and the hero video are content-stable: cache hard.
    <LocationMatch "^/(logos|posters|happens|video|brand)/">
        Header set Cache-Control "public, max-age=31536000, immutable"
    </LocationMatch>

    # Next's build assets are content-hashed → immutable.
    <LocationMatch "^/_next/static/">
        Header set Cache-Control "public, max-age=31536000, immutable"
    </LocationMatch>

    # The registration endpoint must never be cached by anything.
    <LocationMatch "^/api/">
        Header set Cache-Control "no-store"
    </LocationMatch>

    # --- compression ---------------------------------------------------------
    # Text only. Never gzip the mp4 or the JPEGs.
    AddOutputFilterByType DEFLATE text/html text/css application/javascript \
                                  application/json image/svg+xml text/plain

    # --- hardening -----------------------------------------------------------
    Header always set X-Content-Type-Options "nosniff"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set X-Frame-Options "SAMEORIGIN"

    ErrorLog  ${APACHE_LOG_DIR}/expo-tier2-error.log
    CustomLog ${APACHE_LOG_DIR}/expo-tier2-access.log combined
</VirtualHost>
```

```bash
a2ensite expo.tier2rising.com
apachectl configtest        # must say: Syntax OK
systemctl reload apache2
```

> The old `/var/www/tier2expo/expo-public` docroot and its `rsync` are no longer
> used. Once the proxy is confirmed working, that directory can be deleted.

## 7. DNS + TLS

Point an `A` record for `expo.tier2rising.com` at the server, then:

```bash
certbot --apache -d expo.tier2rising.com
```

Certbot rewrites the `:443` block. Re-check afterwards that `Protocols h2 http/1.1`,
the `ProxyPass` rules and the `Header` rules survived — certbot occasionally reorders
directives.

## 8. Verify

```bash
curl -I https://expo.tier2rising.com/                    # 200
curl -I https://expo.tier2rising.com/video/hero.mp4      # 200, immutable, served by Apache
curl -I https://expo.tier2rising.com/logos/sidbi.png     # 200, immutable
curl -s https://expo.tier2rising.com/api/register        # {"ok":true,...} — sheet + mail configured
```

Then submit one real registration through the form and confirm three things: the row
lands in the Sheet, the participant confirmation arrives, and the organiser
notification arrives.

In the browser: hero video autoplays (muted), Network → Protocol column reads `h2`.

---

## Redeploy after a change

```bash
cd /var/www/tier2expo/stepup_dubai
git pull
npm ci
npm run build
pm2 restart expo-tier2
```

No Apache reload needed. `.env` is not in git — if you changed it, edit it on the box
and restart PM2 (env vars are read at process start).

---

## Troubleshooting

**502 Bad Gateway** — Node isn't running. `pm2 status`, `pm2 logs expo-tier2`.

**Registrations fail with "could not save"** — the Apps Script write failed. Check
`pm2 logs expo-tier2` for the `[register] sheet append failed:` line.

**Registrations succeed but no email** — see the troubleshooting table in
[`EMAIL-SETUP.md`](EMAIL-SETUP.md). Most likely the server IP isn't authorised in Brevo.

**`EADDRINUSE`** — a process holds the port:
`kill $(lsof -t -iTCP:3211 -sTCP:LISTEN)`.

**404s on images** — an `Alias` path is wrong, or Apache lacks read permission on
`public/`. Confirm with `curl -I .../logos/sidbi.png` and check the error log.

**Hero video doesn't play** — it's `muted autoplay loop playsinline`; browsers only
autoplay muted video. Confirm `/video/hero.mp4` returns `200 video/mp4`.

**A change didn't take** — you rebuilt but didn't `pm2 restart`. The running process
still holds the old build.
