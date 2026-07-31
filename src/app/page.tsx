import { Hero } from '@/components/home/Hero'
import { CountdownBar } from '@/components/home/CountdownBar'
import { OurStory } from '@/components/home/OurVision'
import { Scores } from '@/components/home/Scores'
import { Zones } from '@/components/home/Zones'
import { WhatGoesOn } from '@/components/home/WhatGoesOn'
import { Partners } from '@/components/home/Partners'
import { Speakers } from '@/components/home/Speakers'
import { Statements } from '@/components/home/Statements'

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
      <Speakers />
      <Statements />
    </>
  )
}
