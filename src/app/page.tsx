import { Hero } from '@/components/home/Hero'
import { CountdownBar } from '@/components/home/CountdownBar'
import { Vision } from '@/components/home/Vision'
import { OurStory } from '@/components/home/OurVision'
import { Scores } from '@/components/home/Scores'
import { Zones } from '@/components/home/Zones'
import { WhatGoesOn } from '@/components/home/WhatGoesOn'
import { Partners } from '@/components/home/Partners'
import { Statements } from '@/components/home/Statements'
import { Tickets } from '@/components/home/Tickets'
import { paymentEnabled } from '@/lib/payments/razorpay'

/**
 * Tickets is the last section and the page's only conversion point. By the time the
 * reader arrives the page has explained the growth zones, the programme and who is in
 * the room, so they have what they need to pick a pass.
 *
 * There used to be a separate free "register for updates" waitlist section after this
 * one, and every Register CTA on the site pointed at it. It was removed: two competing
 * forms meant the loudest button on the page (Register, in the header) led somewhere
 * you could not actually buy anything, and the details it collected — name, email,
 * phone, sector, register-as, city — are the same six the checkout sheet already asks
 * for. One form, attached to the thing being sold. `site.register` now resolves to
 * #tickets, so the header, hero and mobile nav all land here.
 *
 * Prices live in @/content/tickets, which the pass section and the order endpoint both
 * import — see that file for why the price is not an env var.
 *
 * WHY THIS PAGE IS `force-dynamic`
 * The pass cards have to say what clicking them will do. "Book now" when the till is
 * closed is a promise the next page cannot keep, so the card label depends on
 * REGISTRATION_PAYMENT_ENABLED — a server-only env var.
 *
 * Prerendering would freeze that value into the HTML at build time, so closing the till
 * would need a full rebuild rather than a restart, and the homepage would disagree with
 * the checkout page it links to until someone remembered. Rendering per request keeps one
 * source of truth for the whole site.
 *
 * The cost is small and worth naming: no prerendered HTML for the homepage. Every heavy
 * asset — images, the hero video, all of /_next/static — is served straight off disk by
 * Apache and never touches Node (see deploy/), so what is actually rendered per request
 * is one page of markup.
 */
export const dynamic = 'force-dynamic'

export default function Home() {
  return (
    <>
      <Hero />
      <CountdownBar />
      <Vision />
      <OurStory />
      <Scores />
      <Zones />
      <WhatGoesOn />
      <Partners />
      <Statements />
      <Tickets paymentEnabled={paymentEnabled} />
    </>
  )
}
