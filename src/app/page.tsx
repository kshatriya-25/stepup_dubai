import { Hero } from '@/components/home/Hero'
import { CountdownBar } from '@/components/home/CountdownBar'
import { OurStory } from '@/components/home/OurVision'
import { Scores } from '@/components/home/Scores'
import { Zones } from '@/components/home/Zones'
import { WhatGoesOn } from '@/components/home/WhatGoesOn'
import { Partners } from '@/components/home/Partners'
import { Statements } from '@/components/home/Statements'
import { Register } from '@/components/home/Register'

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
      <Register />
    </>
  )
}
