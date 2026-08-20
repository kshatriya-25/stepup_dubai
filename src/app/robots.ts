import type { MetadataRoute } from 'next'
import { isProductionSite, siteUrl } from '@/lib/site-env'

/**
 * /robots.txt, generated per deployment.
 *
 * WHY THIS IS A ROUTE AND NOT public/robots.txt
 * A file in public/ is version-controlled and identical in every deployment. A
 * `Disallow: /` written there to hide staging would deploy straight to production on
 * the next release and de-index the real site — the failure would be silent, and by
 * the time anyone noticed the traffic drop, the crawl damage would already be done.
 * Generating it means each deployment states its own answer and neither can be wrong
 * for the other.
 *
 * Staging also carries `X-Robots-Tag: noindex, nofollow, noarchive` from Apache (see
 * deploy/staging.tier2rising.com-le-ssl.conf). That is deliberate belt and braces and
 * not a duplicate: robots.txt asks a crawler not to FETCH a page, the header tells it
 * not to INDEX one it has already fetched. A URL that is only disallowed in robots.txt
 * can still appear in results — Google will list it, unfetched, from inbound links
 * alone. Blocking the crawl also means the header is never read, so neither mechanism
 * covers the other's case on its own.
 */
export default function robots(): MetadataRoute.Robots {
  if (!isProductionSite) {
    return {
      rules: { userAgent: '*', disallow: '/' },
    }
  }

  return {
    rules: { userAgent: '*', allow: '/' },
    host: siteUrl,
  }
}
