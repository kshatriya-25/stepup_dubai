import { Hero } from '@/components/home/Hero'
import { CountdownBar } from '@/components/home/CountdownBar'
import { OurStory } from '@/components/home/OurVision'
import { Scores } from '@/components/home/Scores'
import { Zones } from '@/components/home/Zones'
import { WhatGoesOn } from '@/components/home/WhatGoesOn'
import { Partners } from '@/components/home/Partners'
import { Statements } from '@/components/home/Statements'
import { Tickets } from '@/components/home/Tickets'
import { Register } from '@/components/home/Register'

/**
 * Tickets sit directly before Register: by this point the page has explained the
 * growth zones, the programme and who is in the room, so the reader has what they need
 * to pick a pass. Register follows as the softer option for anyone not ready to buy.
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
      <Register />
    </>
  )
}
