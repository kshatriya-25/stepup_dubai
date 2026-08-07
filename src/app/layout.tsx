import type { Metadata } from 'next'
import { Alexandria } from 'next/font/google'
import './globals.css'
import { site } from '@/content/site'
import { ParticipateProvider } from '@/components/shell/ParticipateModal'
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
        <ParticipateProvider>
          <SiteNav />
          <main id="top">{children}</main>
          <SiteFooter />
        </ParticipateProvider>
        <Analytics />
      </body>
    </html>
  )
}
