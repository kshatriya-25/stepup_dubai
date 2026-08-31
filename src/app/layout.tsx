import type { Metadata } from 'next'
import { Alexandria } from 'next/font/google'
import './globals.css'
import { site } from '@/content/site'
import { PartnerProvider } from '@/components/shell/PartnerModal'
import { RegisterProvider } from '@/components/shell/RegisterModal'
import { pricedTickets } from '@/lib/pricing'
import { SiteNav } from '@/components/shell/SiteNav'
import { SiteFooter } from '@/components/shell/SiteFooter'
import { Analytics } from '@/components/shell/Analytics'

const alexandria = Alexandria({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '900'],
  variable: '--font-alexandria',
  display: 'swap',
})

export const metadata: Metadata = {
  title: `${site.fullName} | ${site.dates}, ${site.venue}`,
  description: site.taglineLong,
  openGraph: {
    title: `${site.fullName} | ${site.dates}`,
    description: site.taglineLong,
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={alexandria.variable}>
      <body className="font-sans">
        {/*
          The Register dialog is mounted here, not in the header, because the header is
          not the only thing that opens it and because it must survive a client-side
          navigation between passes without unmounting mid-animation.

          `pricedTickets` is resolved HERE, on the server, because it carries the staging
          price override — @/lib/pricing is server-only by construction, so a client
          component cannot read it and would quote catalogue prices in front of a ₹2
          checkout.

          NOTHING TILL-DEPENDENT GOES IN. /_not-found prerenders this layout statically, so
          REGISTRATION_PAYMENT_ENABLED read here would be frozen at build time — the same
          trap that generateStaticParams set for /passes/[pass]. The dialog is written not
          to need it.
        */}
        <RegisterProvider tickets={pricedTickets}>
          <PartnerProvider>
            <SiteNav />
            <main id="top">{children}</main>
            <SiteFooter />
          </PartnerProvider>
        </RegisterProvider>
        <Analytics />
      </body>
    </html>
  )
}
