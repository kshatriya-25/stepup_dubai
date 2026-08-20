/**
 * Is this build the real, public tier2rising.com — or a staging copy of it?
 *
 * Two things must be true only on the production site: Google Analytics may report,
 * and search engines may index. Both are answered from here so they cannot disagree.
 *
 * WHY THIS IS NOT `NODE_ENV`
 * The analytics component used to gate on `NODE_ENV !== 'production'`. That correctly
 * silences `npm run dev`, but staging is built with `next build` and served with
 * `next start`, so NODE_ENV is 'production' there too — staging pageviews were being
 * reported into the client's live GA4 property, mixed in with real traffic and
 * impossible to separate afterwards.
 *
 * WHY THE PRODUCTION ORIGIN IS HARD-CODED
 * Deriving "am I production?" from an env var that says so would let a copied .env
 * claim to be production. Naming the real origin here means only the deployment
 * actually configured for tier2rising.com can match, and a staging box that forgets to
 * change anything still fails to the safe side: no analytics, no indexing.
 *
 * Staging must set NEXT_PUBLIC_SITE_URL to its own origin — which deploy/STAGING.md
 * already requires, because the same value builds the links inside registration
 * emails. A staging box with production's URL here would send customers to the wrong
 * site long before analytics became the interesting problem.
 */
const PRODUCTION_ORIGIN = 'https://tier2rising.com'

/** Trailing slash and case are not meaningful in an origin; normalise both away. */
function normalise(url: string): string {
  return url.trim().replace(/\/+$/, '').toLowerCase()
}

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || '').trim() || PRODUCTION_ORIGIN

export const isProductionSite = normalise(siteUrl) === normalise(PRODUCTION_ORIGIN)
