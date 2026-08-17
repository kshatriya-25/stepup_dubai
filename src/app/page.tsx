import { Hero } from '@/components/home/Hero'
import { CountdownBar } from '@/components/home/CountdownBar'
import { OurStory } from '@/components/home/OurVision'
import { Scores } from '@/components/home/Scores'
import { Zones } from '@/components/home/Zones'
import { WhatGoesOn } from '@/components/home/WhatGoesOn'
import { Partners } from '@/components/home/Partners'
import { Statements } from '@/components/home/Statements'
import { Tickets } from '@/components/home/Tickets'

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
 * No payment config is read here any more. Prices live in @/content/tickets, which the
 * ticket section and the order endpoint both import — see that file for why the price
 * is not an env var.
 */
export default function Home() {
  return (
    <>
      <Hero />
      <CountdownBar />
      <OurStory />
      <Scores />
      <Zones />
      <WhatGoesOn />
      <Partners />
      <Statements />
      <Tickets />
    </>
  )
}
