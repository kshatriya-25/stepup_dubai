import { Container } from '@/components/primitives/Container'
import { Eyebrow, SectionHeading } from '@/components/primitives/SectionHeading'
import { Reveal } from '@/components/primitives/Reveal'
import { whatGoesOn } from '@/content/home'

/** Programme — image cards using the provided posters, with reveal + hover zoom. */
export function WhatGoesOn() {
  return (
    <section id="whatgoeson" className="bg-black">
      <Container className="py-16 md:py-24">
        <Reveal>
          <Eyebrow className="text-magenta">Two Days, One Weekend</Eyebrow>
          <SectionHeading className="mt-4 text-surface">What Happens</SectionHeading>
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {whatGoesOn.map((c, i) => (
            <Reveal key={c.label} delay={(i % 3) * 0.08}>
              <div className="group relative aspect-[4/3] overflow-hidden bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.img}
                  alt={c.label}
                  className="absolute inset-0 h-full w-full object-cover brightness-[0.92] saturate-[1.05] transition-transform duration-[900ms] ease-out group-hover:scale-110"
                />
                {/* brand-tinted wash so the dull footage pops */}
                <span className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                <span className="absolute inset-0 bg-accent/0 transition-colors duration-500 group-hover:bg-accent/10" />
                <span className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5">
                  <span className="font-sans text-xl font-bold uppercase leading-tight text-surface">{c.label}</span>
                  <span className="h-0 w-8 self-end bg-accent transition-all duration-300 group-hover:h-1.5" />
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}
