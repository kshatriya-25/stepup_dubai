import Script from 'next/script'

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
 * Production only — `npm run dev` would otherwise report every local page view into
 * the live property and quietly skew the event's numbers.
 */
export function Analytics() {
  if (process.env.NODE_ENV !== 'production') return null

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
