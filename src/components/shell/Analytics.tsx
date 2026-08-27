import Script from 'next/script'
import { isProductionSite } from '@/lib/site-env'

/** GA4 property supplied by the Namma Office team. */
const GA_ID = 'G-W2PYR2R89G'

/** Microsoft Clarity project — session recordings and heatmaps. */
const CLARITY_ID = 'xx7unn8vdp'

/**
 * Google Analytics 4 and Microsoft Clarity.
 *
 * Uses next/script rather than raw <script> tags in <head>: `afterInteractive`
 * loads each tag once the page is interactive, so analytics never blocks first paint.
 * That is Google's own recommendation for the gtag snippet and is equivalent to the
 * `async` attribute in the copy-paste versions — Clarity's snippet already sets
 * `t.async = 1` itself, so it wants the same treatment.
 *
 * THE REAL SITE ONLY. Two separate gates, because they catch different things:
 *
 *   NODE_ENV        stops `npm run dev` reporting local page views.
 *   isProductionSite stops STAGING reporting. Staging is built and served exactly like
 *                   production, so NODE_ENV is 'production' there too — on its own that
 *                   check let every staging click land in the client's live GA4
 *                   property, indistinguishable from real traffic afterwards.
 *
 * Both gates cover BOTH vendors. Clarity records sessions, so a staging leak there is
 * worse than a skewed pageview count: it would file replays of internal QA clicking
 * through half-built pages into the client's real recording library.
 *
 * Nothing is loaded when either gate is closed: no gtag script, no Clarity script, no
 * cookie, no request to googletagmanager.com or clarity.ms. This returns null rather
 * than loading the tags in a disabled state, so there is nothing to misconfigure later.
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

      <Script id="clarity-init" strategy="afterInteractive">
        {`
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${CLARITY_ID}");
        `}
      </Script>
    </>
  )
}
