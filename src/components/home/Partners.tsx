import { Container } from '@/components/primitives/Container'
import { Eyebrow, SectionHeading } from '@/components/primitives/SectionHeading'
import { Reveal } from '@/components/primitives/Reveal'
import { partners, govPartners } from '@/content/home'

/** Partners — an elevated, card-led presentation: principal partners as premium
 *  cards with their roles, then an institutional band for government / banking. */
export function Partners() {
  const govItems = govPartners.flatMap((g) => g.items)
  return (
    <section id="partners" className="bg-foam">
      <Container wide className="py-16 md:py-24">
        <Reveal>
          <Eyebrow className="text-accent">Backed by the ecosystem</Eyebrow>
          <SectionHeading className="mt-4 text-ink">Our Partners</SectionHeading>
          <p className="mt-4 max-w-xl text-base text-muted">
            The people building this room with us — from principal organisers to the technology behind it.
          </p>
        </Reveal>

        {/* Principal partners — clean white logo cards with a caption below */}
        <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-9 sm:grid-cols-3 lg:grid-cols-4 md:mt-14">
          {partners.map((p, i) => (
            <Reveal key={p.name} delay={(i % 4) * 0.08}>
              <div className="group flex flex-col items-center">
                <div className="flex aspect-[16/10] w-full items-center justify-center rounded-xl border border-ink/[0.08] bg-surface px-6 py-5 shadow-[0_4px_16px_-6px_rgba(7,43,95,0.15)] transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_14px_30px_-10px_rgba(7,43,95,0.22)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.logo}
                    alt={p.name}
                    className="max-h-14 w-auto max-w-[80%] object-contain transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <p className="mt-4 max-w-[90%] text-center text-sm leading-snug text-ink/75 sm:text-base">
                  {p.label}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>

      {/* Government / Banking / Ecosystem — institutional band on navy */}
      <div className="bg-base">
        <Container wide className="pt-14 text-center md:pt-16">
          <Reveal>
            <Eyebrow className="text-accent">Institutional support</Eyebrow>
            <h2 className="mt-4 font-sans text-3xl font-bold uppercase tracking-[-0.01em] text-surface md:text-5xl">
              Government · Banking · Ecosystem
            </h2>
          </Reveal>
        </Container>

        <div className="overflow-hidden py-12">
          <div
            className="flex w-max animate-marquee gap-4"
            style={{
              maskImage: 'linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)',
              WebkitMaskImage: 'linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)',
            }}
          >
            {[...govItems, ...govItems].map((it, i) => (
              <div
                key={i}
                className="flex h-20 min-w-[160px] items-center justify-center gap-2.5 rounded-xl bg-surface px-6 shadow-lg sm:min-w-[200px] sm:px-8"
              >
                {it.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.logo} alt={it.name} className="max-h-12 w-auto object-contain" />
                ) : (
                  <>
                    <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />
                    <span className="whitespace-nowrap font-sans text-base font-bold uppercase tracking-[0.02em] text-ink/85 sm:text-lg">
                      {it.name}
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <Container className="pb-14 md:pb-16">
          <p className="text-center text-sm text-surface/60">
            To sponsor, speak or nominate a startup — contact the Tier-2 Rising organising committee.
          </p>
        </Container>
      </div>
    </section>
  )
}
