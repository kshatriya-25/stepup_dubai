import { Hero } from '@/components/home/Hero'
import { CountdownBar } from '@/components/home/CountdownBar'
import { OurStory } from '@/components/home/OurVision'
import { Scores } from '@/components/home/Scores'
import { Zones } from '@/components/home/Zones'
import { WhatGoesOn } from '@/components/home/WhatGoesOn'
import { Partners } from '@/components/home/Partners'
import { Statements } from '@/components/home/Statements'
import { Register } from '@/components/home/Register'
import { paymentConfig, formatInr } from '@/lib/payments/razorpay'

/**
 * The ticket price is read here, in a server component, and handed to the form as a
 * prop. Deliberately NOT a NEXT_PUBLIC_ variable: that would be a second copy of the
 * price living in the browser bundle, free to drift from the REGISTRATION_FEE_INR the
 * server actually charges — and a displayed price that disagrees with the amount
 * debited is the kind of bug that ends in refunds. One source, read once.
 */
export default function Home() {
  const cfg = paymentConfig()
  const payment =
    cfg.ok && cfg.enabled
      ? { enabled: true as const, amountLabel: formatInr(cfg.amountPaise) }
      : { enabled: false as const, amountLabel: '' }

  if (!cfg.ok) console.error('[payments]', cfg.error)

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
      <Register payment={payment} />
    </>
  )
}
