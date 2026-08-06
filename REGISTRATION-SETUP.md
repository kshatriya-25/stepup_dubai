# Registration → Google Sheet (setup)

The site is a **static export on Apache** — there is no backend. Registrations are
captured with a **Google Apps Script Web App** that appends each submission as a row
in a Google Sheet you own. The Sheet is your read-only record; only the script
(running as you) writes to it.

```
Form on site  ──POST──▶  Apps Script Web App  ──append row──▶  Google Sheet
```

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
- The `NEXT_PUBLIC_` prefix is **required** — this is a static export with no server, so
  only `NEXT_PUBLIC_*` vars get inlined into the browser bundle at build time.
- `NEXT_PUBLIC_REGISTRATION_DEPLOYMENT_ID` is kept for reference only; the code doesn't
  use it (the `/exec` URL already contains the deployment id).

Then rebuild and redeploy: `npm run build` → rsync `out/` (see `HOSTING.md`).

> The endpoint URL is baked into the static files in `out/` at build time. That's expected —
> it's a public write-only endpoint. **Re-run `npm run build` after any `.env` change**, or the
> old value stays in the bundle.

## Test it
1. Open the live site, scroll to **Register for ticket updates**, submit a test entry.
2. A new row should appear in the Sheet within a second or two.
3. You can also open the `/exec` URL directly in a browser — it returns
   `{"ok":true,...}` to confirm the endpoint is live.

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

To add/remove fields later, update both the form in `src/components/home/Register.tsx`
and the `COLUMNS` list in `registration/Code.gs`.

## If you change the script later
Re-deploy: **Deploy → Manage deployments → (edit) → Version: New version → Deploy**.
The `/exec` URL stays the same, so no site change is needed.

## Notes
- The form POSTs with `mode: 'no-cors'`, so the browser can't read the response;
  the site optimistically shows the thank-you state. A network failure shows an
  error message with your contact email. This is the standard pattern for a static
  site + Apps Script and is reliable in practice.
- No API keys or secrets live in the site — the `/exec` URL is a public write-only
  endpoint by design.
