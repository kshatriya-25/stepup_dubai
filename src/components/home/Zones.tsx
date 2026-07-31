import { ArrowUpRight } from 'lucide-react'
import { Container } from '@/components/primitives/Container'
import { Eyebrow, SectionHeading } from '@/components/primitives/SectionHeading'
import { Reveal } from '@/components/primitives/Reveal'
import { zones, type Zone } from '@/content/home'
import { cn } from '@/lib/cn'

const bar: Record<Zone['accent'], string> = {
  accent: 'bg-accent',
  magenta: 'bg-magenta',
  cyan: 'bg-cyan',
  gold: 'bg-gold',
  purple: 'bg-purple',
  mint: 'bg-mint',
}

/** Growth Zones — tiles like the original, now with scroll-reveal + hover motion. */
export function Zones() {
  return (
    <section id="zones" className="bg-surface">
      <Container className="py-16 md:py-24">
        <Reveal>
          <Eyebrow className="text-magenta">Open All Day</Eyebrow>
          <SectionHeading className="mt-4 text-black">Startup Growth Zones</SectionHeading>
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {zones.map((z, i) => (
            <Reveal key={z.title} delay={i * 0.08}>
              <div className="group relative flex h-full min-h-[220px] flex-col justify-between overflow-hidden border border-black/10 bg-black p-6 text-surface transition-all duration-300 hover:-translate-y-1.5 hover:border-accent hover:shadow-2xl">
                <span className={cn('h-1.5 w-10 transition-all duration-300 group-hover:w-20', bar[z.accent])} />
                <div>
                  <h3 className="font-sans text-lg font-bold uppercase leading-tight">{z.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-surface/70">{z.sub}</p>
                </div>
                <ArrowUpRight
                  size={22}
                  className="absolute right-5 top-5 text-accent opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100"
                />
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}
