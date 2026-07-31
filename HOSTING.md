# Hosting — expo.tier2rising.com (Apache)

Deploying the Tier-2 Rising summit site onto the existing Apache box
(`/var/www/tier2expo/stepup_dubai`) that already serves other vhosts.

The site is **100% static** (all routes prerender, plain `<img>` — no image
optimizer, no API routes, no server data). So Apache serves the files directly —
**no Node process, no PM2, no reverse proxy, no port to babysit.** Total payload
is ~6.6 MB (one 2.7 MB hero video + a handful of images/logos).

---

## 1. Config (already in the repo — verify after pull)

`next.config.mjs` must contain:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  output: 'export',            // emits ./out
  images: { unoptimized: true },
  trailingSlash: true,         // /page/index.html — matches Apache dir resolution
}
export default nextConfig
```

> If a `next build` ever errors with *"Page … is not compatible with output: export"*,
> something added a dynamic route handler or server action. There are none today;
> keep it that way, or move to Option B below.

## 2. Build

```bash
cd /var/www/tier2expo/stepup_dubai
git pull
npm ci
npm run build            # emits ./out  (~6.6 MB)
```

Verify before going further:

```bash
ls out/index.html out/logos/sidbi.png out/video/hero.mp4 out/happens/bootcamp.jpg
du -sh out
```

## 3. Point a docroot at it (decoupled from the build)

Keep the build dir and the *served* dir separate, so a failed build never takes
the live site down (and never collides with the other vhost under this box):

```bash
mkdir -p /var/www/tier2expo/expo-public
rsync -a --delete out/ /var/www/tier2expo/expo-public/
chown -R www-data:www-data /var/www/tier2expo/expo-public
```

## 4. Enable the modules

```bash
a2enmod headers expires deflate http2 ssl
systemctl restart apache2
```

## 5. Vhost

`/etc/apache2/sites-available/expo.tier2rising.com.conf`

```apache
<VirtualHost *:80>
    ServerName expo.tier2rising.com
    DocumentRoot /var/www/tier2expo/expo-public
    Redirect permanent / https://expo.tier2rising.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName expo.tier2rising.com
    DocumentRoot /var/www/tier2expo/expo-public

    Protocols h2 http/1.1

    <Directory /var/www/tier2expo/expo-public>
        Options -Indexes +FollowSymLinks
        AllowOverride None
        Require all granted
        DirectoryIndex index.html
    </Directory>

    ErrorDocument 404 /404.html

    # --- caching -----------------------------------------------------------
    # Images, logos and the hero video are content-stable: cache hard.
    <LocationMatch "^/(logos|posters|happens|video)/">
        Header set Cache-Control "public, max-age=31536000, immutable"
    </LocationMatch>

    # Next's build assets are content-hashed → immutable.
    <LocationMatch "^/_next/static/">
        Header set Cache-Control "public, max-age=31536000, immutable"
    </LocationMatch>

    # HTML must revalidate or a redeploy won't be picked up.
    <FilesMatch "\.html$">
        Header set Cache-Control "no-cache, must-revalidate"
    </FilesMatch>

    # --- compression -------------------------------------------------------
    # Text only. Never gzip the mp4 or the JPEGs.
    AddOutputFilterByType DEFLATE text/html text/css application/javascript \
                                  application/json image/svg+xml text/plain

    # --- hardening ---------------------------------------------------------
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

## 6. DNS + TLS

Point an `A` record for `expo.tier2rising.com` at the server, then:

```bash
certbot --apache -d expo.tier2rising.com
```

Certbot rewrites the `:443` block. Re-check afterwards that `Protocols h2 http/1.1`
and the `Header` rules survived — certbot occasionally reorders directives.

## 7. Verify

```bash
curl -I https://expo.tier2rising.com/                       # 200, Cache-Control: no-cache
curl -I https://expo.tier2rising.com/video/hero.mp4         # 200, immutable
curl -I https://expo.tier2rising.com/logos/sidbi.png        # 200, immutable
```

In the browser: hero video autoplays (muted), Network → Protocol column reads `h2`.

---

## Redeploy after a change

```bash
cd /var/www/tier2expo/stepup_dubai
git pull
npm ci
npm run build
rsync -a --delete out/ /var/www/tier2expo/expo-public/
```

No Apache reload needed — HTML is `no-cache`, hashed assets are immutable.

---

## Option B — Node + reverse proxy (only if you add server features)

Only if you later add API routes, server actions or ISR. Otherwise Option A wins.

Remove `output: 'export'` from `next.config.mjs`, then:

```bash
npm ci && npm run build
npm i -g pm2
pm2 start "npx next start -p 3211" --name expo-tier2
pm2 save && pm2 startup
```

```apache
a2enmod proxy proxy_http
# inside the :443 vhost — serve static off disk, proxy the rest:
Alias /_next/static /var/www/tier2expo/stepup_dubai/.next/static
Alias /logos        /var/www/tier2expo/stepup_dubai/public/logos
Alias /posters      /var/www/tier2expo/stepup_dubai/public/posters
Alias /happens      /var/www/tier2expo/stepup_dubai/public/happens
Alias /video        /var/www/tier2expo/stepup_dubai/public/video

ProxyPreserveHost On
ProxyPass        /_next/static !
ProxyPass        /logos !
ProxyPass        /posters !
ProxyPass        /happens !
ProxyPass        /video !
ProxyPass        / http://127.0.0.1:3211/
ProxyPassReverse / http://127.0.0.1:3211/
```

Pick a free port: `ss -tlnp | grep 3211`.

---

## Troubleshooting

**Redeploy didn't take** — HTML got cached. Confirm `Cache-Control: no-cache` on
`/` and that `mod_headers` is enabled (`a2enmod headers`).

**Hero video doesn't play** — it's `muted autoplay loop playsinline`; browsers only
autoplay muted video. Confirm `/video/hero.mp4` returns `200 video/mp4`.

**`EADDRINUSE`** (Option B) — a process holds the port:
`kill $(lsof -t -iTCP:3211 -sTCP:LISTEN)`.

**404s on assets** — `DocumentRoot` is pointing at the repo instead of
`/var/www/tier2expo/expo-public`. Re-run the rsync in step 3.
