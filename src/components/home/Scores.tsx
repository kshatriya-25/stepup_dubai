import { Container } from '@/components/primitives/Container'
import { Reveal } from '@/components/primitives/Reveal'
import { CountUp } from '@/components/primitives/CountUp'
import { scores } from '@/content/home'

/** Stats strip — black band, numbers count up on scroll. */
export function Scores() {
  return (
    <section className="bg-black text-surface">
      <Container>
        <div className="grid divide-y divide-surface/15 sm:grid-cols-2 sm:divide-x lg:grid-cols-4 lg:divide-y-0">
          {scores.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.1}>
              <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
                <CountUp
                  value={s.n}
                  className="font-sans text-5xl font-bold leading-none text-surface md:text-6xl"
                />
                <span className="text-sm uppercase tracking-[0.12em] text-surface/70">{s.label}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}
