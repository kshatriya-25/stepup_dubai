import Script from 'next/script'
import { isProductionSite } from '@/lib/site-env'

/** GA4 property supplied by the Namma Office team. */
const GA_ID = 'G-W2PYR2R89G'

/**
 * Google Analytics 4.
 *
 * Uses next/script rather than raw <script> tags in <head>: `afterInteractive`
 * loads gtag once the page is interactive, so analytics never blocks first paint.
 * That is Google's own recommendation for the gtag snippet and is equivalent to the
 * `async` attribute in the copy-paste version.
 *
 * THE REAL SITE ONLY. Two separate gates, because they catch different things:
 *
 *   NODE_ENV        stops `npm run dev` reporting local page views.
 *   isProductionSite stops STAGING reporting. Staging is built and served exactly like
 *                   production, so NODE_ENV is 'production' there too — on its own that
 *                   check let every staging click land in the client's live GA4
 *                   property, indistinguishable from real traffic afterwards.
 *
 * Nothing is loaded when either gate is closed: no gtag script, no cookie, no request
 * to googletagmanager.com. This returns null rather than configuring gtag with
 * consent denied, so there is nothing to misconfigure later.
 */
export function Analytics() {
  if (process.env.NODE_ENV !== 'production') return null
  if (!isProductionSite) return null

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  )
}
