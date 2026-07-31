import { ArrowUpRight } from 'lucide-react'
import { Container } from '@/components/primitives/Container'
import { Eyebrow, SectionHeading } from '@/components/primitives/SectionHeading'
import { Reveal } from '@/components/primitives/Reveal'
import { zones, type Zone } from '@/content/home'
import { cn } from '@/lib/cn'

const tone: Record<Zone['accent'], { bar: string; text: string }> = {
  accent: { bar: 'bg-accent', text: 'text-accent' },
  purple: { bar: 'bg-purple', text: 'text-purple' },
  cyan: { bar: 'bg-cyan', text: 'text-cyan' },
  gold: { bar: 'bg-gold', text: 'text-gold' },
  green: { bar: 'bg-green', text: 'text-green' },
}

/** Growth Zones — indexed navy tiles with scroll-reveal + hover motion. */
export function Zones() {
  return (
    <section id="zones" className="bg-surface">
      <Container className="py-16 md:py-24">
        <Reveal>
          <Eyebrow className="text-accent">Open All Day</Eyebrow>
          <SectionHeading className="mt-4 text-ink">Startup Growth Zones</SectionHeading>
          <p className="mt-5 max-w-2xl text-lg text-muted">
            Walk in anytime — schemes sanctioned, connects made and deals explored on the spot.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {zones.map((z, i) => (
            <Reveal key={z.title} delay={i * 0.08}>
              <div className="group relative flex h-full min-h-[240px] flex-col overflow-hidden border border-ink/10 bg-base p-6 text-surface transition-all duration-300 hover:-translate-y-1.5 hover:bg-base-2 hover:border-accent hover:shadow-2xl">
                <div className="flex items-start justify-between">
                  <span className={cn('font-sans text-3xl font-bold leading-none', tone[z.accent].text)}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <ArrowUpRight
                    size={22}
                    className="text-accent opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100"
                  />
                </div>
                <span className={cn('mt-5 h-1 w-10 transition-all duration-300 group-hover:w-16', tone[z.accent].bar)} />
                <div className="mt-auto pt-6">
                  <h3 className="font-sans text-lg font-bold uppercase leading-tight">{z.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-surface/70">{z.sub}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}
