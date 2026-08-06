# Registration → Google Sheet (setup)

Registrations are captured with a **Google Apps Script Web App** that appends each
submission as a row in a Google Sheet you own. The Sheet is your read-only record;
only the script (running as you) writes to it.

```
Form on site  ──POST──▶  /api/register  ──POST──▶  Apps Script Web App  ──append row──▶  Google Sheet
                              │
                              └── also sends the two confirmation emails (EMAIL-SETUP.md)
```

> **This changed.** The form used to POST straight to Apps Script from the browser.
> It now goes through the site's own `/api/register` route, which writes the Sheet
> *and* sends the emails. The Apps Script side is unchanged — same script, same
> deployment, same `/exec` URL.

## One-time setup (~5 minutes)

### 1. Create the Sheet
1. Go to <https://sheets.new> and name it e.g. **Tier-2 Rising — Registrations**.

### 2. Add the script
1. In that Sheet: **Extensions → Apps Script**.
2. Delete any starter code, then paste the entire contents of
   [`registration/Code.gs`](registration/Code.gs).
3. Click the **Save** (disk) icon.

### 3. Deploy as a Web App
1. Top-right **Deploy → New deployment**.
2. Gear icon → **Web app**.
3. Set:
   - **Description:** `Tier-2 registrations`
   - **Execute as:** **Me**
   - **Who has access:** **Anyone**  ← required so the public form can POST
4. **Deploy** → approve the Google permission prompt (it's your own script).
5. Copy the **Web app URL**. It ends in **`/exec`**, e.g.
   `https://script.google.com/macros/s/AKfy.../exec`

### 4. Wire it into the site
The URL is read from `.env` (gitignored, so it is never committed). Set:
```
NEXT_PUBLIC_REGISTRATION_ENDPOINT=https://script.google.com/macros/s/AKfy.../exec
```
- The name keeps its `NEXT_PUBLIC_` prefix for backwards compatibility, but the value is
  now read **server-side** by `src/app/api/register/route.ts`. It's harmless either way —
  the `/exec` URL is a public write-only endpoint by design.
- `NEXT_PUBLIC_REGISTRATION_DEPLOYMENT_ID` is kept for reference only; the code doesn't
  use it (the `/exec` URL already contains the deployment id).

Then rebuild and restart: `npm run build && pm2 restart expo-tier2` (see `HOSTING.md`).

## Test it
1. Check what's wired: `curl -s https://expo.tier2rising.com/api/register` — it should
   report `"sheet":"configured"` and `"mail":"configured"`.
2. Open the live site, scroll to **Register for ticket updates**, submit a test entry.
3. A new row should appear in the Sheet within a second or two, and both emails should
   arrive.
4. You can also open the `/exec` URL directly in a browser — it returns
   `{"ok":true,...}` to confirm the Apps Script endpoint itself is live.

If step 2 shows an error, the message is the real server-side reason (the form now reads
the response instead of guessing). Server-side detail is in `pm2 logs expo-tier2`.

## Making the Sheet read-only
- **For teammates who should only view:** Share → give them **Viewer** access.
  The script still writes because it runs as *you*, the owner.
- **To stop accidental manual edits by editors:** select the data range →
  **Data → Protect sheets and ranges**.

## Fields captured
`Timestamp · Name · Sector · Email · Phone · City`

> The columns changed. Replace the old script with the current `registration/Code.gs`,
> then reset the sheet to the new columns: clear the `Registrations` tab (delete the old
> header + any test rows), run the **`setupHeaders`** function once, and
> **Deploy → Manage deployments → New version**. The `/exec` URL stays the same.

To add/remove fields later, update all four places: the form in
`src/components/home/Register.tsx`, the validation in `src/app/api/register/route.ts`,
the `Registration` type and templates in `src/lib/email/templates.ts`, and the
`COLUMNS` list in `registration/Code.gs`.

## If you change the script later
Re-deploy: **Deploy → Manage deployments → (edit) → Version: New version → Deploy**.
The `/exec` URL stays the same, so no site change is needed.

## Notes
- The browser POSTs same-origin to `/api/register` and reads the real response, so the
  thank-you state means the row actually landed. (Previously the form fired at Apps
  Script with `mode: 'no-cors'` and showed success optimistically, whether or not the
  write succeeded.)
- The `/exec` URL is a public write-only endpoint by design and carries no secret. The
  SMTP password *is* a secret and lives only in the server's `.env` — see
  [`EMAIL-SETUP.md`](EMAIL-SETUP.md).
- The endpoint is rate-limited to 5 submissions per IP per hour and carries a honeypot
  field, because it can now trigger outbound mail.
