import { Container } from '@/components/primitives/Container'
import { Reveal } from '@/components/primitives/Reveal'
import { partners, govPartners } from '@/content/home'

/** Partners — presented like the original: a bold green tier band, then a white logo row. */
export function Partners() {
  const govItems = govPartners.flatMap((g) => g.items)
  return (
    <section id="partners" className="bg-surface">
      {partners.map((p, i) => (
        <div key={p.name}>
          <div className="bg-accent">
            <Container className="py-7 text-center md:py-9">
              <Reveal>
                <h2 className="font-sans text-3xl font-bold uppercase tracking-[-0.01em] text-accent-ink md:text-5xl">
                  {p.label}
                </h2>
              </Reveal>
            </Container>
          </div>
          <div className={i % 2 === 0 ? 'bg-surface' : 'bg-foam'}>
            <Container className="flex justify-center py-12 md:py-16">
              <Reveal>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.logo}
                  alt={p.name}
                  className="h-11 w-auto max-w-[200px] object-contain transition-transform duration-500 hover:scale-105 md:h-14"
                />
              </Reveal>
            </Container>
          </div>
        </div>
      ))}

      {/* Government / Banking / Ecosystem — bold band + auto-scrolling marquee */}
      <div className="bg-accent">
        <Container className="py-7 text-center md:py-9">
          <Reveal>
            <h2 className="font-sans text-3xl font-bold uppercase tracking-[-0.01em] text-accent-ink md:text-5xl">
              Government · Banking · Ecosystem
            </h2>
          </Reveal>
        </Container>
      </div>
      <div className="overflow-hidden bg-foam py-12">
        <div
          className="flex w-max animate-marquee gap-4"
          style={{ maskImage: 'linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)', WebkitMaskImage: 'linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)' }}
        >
          {[...govItems, ...govItems].map((it, i) => (
            <div
              key={i}
              className="flex h-20 min-w-[200px] items-center justify-center gap-2.5 border border-ink/10 bg-surface px-8 shadow-sm"
            >
              {it.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.logo} alt={it.name} className="max-h-12 w-auto object-contain" />
              ) : (
                <>
                  <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />
                  <span className="whitespace-nowrap font-sans text-lg font-bold uppercase tracking-[0.02em] text-ink/85">
                    {it.name}
                  </span>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <Container className="py-12">
        <p className="text-center text-sm text-muted">
          To sponsor, speak or nominate a startup — contact the Tier-2 Rising organising committee.
        </p>
      </Container>
    </section>
  )
}
