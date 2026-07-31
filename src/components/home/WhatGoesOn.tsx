import { Container } from '@/components/primitives/Container'
import { Eyebrow, SectionHeading } from '@/components/primitives/SectionHeading'
import { Reveal } from '@/components/primitives/Reveal'
import { whatGoesOn } from '@/content/home'

/** Programme — clean white cards like STEP: image, title, short description. */
export function WhatGoesOn() {
  return (
    <section id="whatgoeson" className="bg-surface">
      <Container className="py-16 md:py-24">
        <Reveal>
          <Eyebrow className="text-magenta">Two Days, One Weekend</Eyebrow>
          <SectionHeading className="mt-4 text-black">What Happens</SectionHeading>
        </Reveal>

        <div className="mt-12 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {whatGoesOn.map((c, i) => (
            <Reveal key={c.label} delay={(i % 3) * 0.08}>
              <div className="group">
                <div className="relative aspect-[4/3] overflow-hidden bg-foam">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.img}
                    alt={c.label}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105"
                  />
                  <span className="absolute bottom-0 left-0 h-1 w-0 bg-accent transition-all duration-300 group-hover:w-full" />
                </div>
                <h3 className="mt-5 font-sans text-xl font-bold uppercase tracking-tight text-black">{c.label}</h3>
                <p className="mt-2 text-base leading-relaxed text-muted">{c.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <div className="mt-14 flex justify-center">
            <a
              href="#register"
              className="bg-accent px-8 py-4 font-sans text-btn font-bold uppercase text-accent-ink transition-colors hover:bg-black hover:text-surface"
            >
              Register Free
            </a>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
