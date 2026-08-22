import { Container } from '@/components/primitives/Container'
import { Reveal } from '@/components/primitives/Reveal'
import { visionPillars } from '@/content/home'

/**
 * Vision / Mission — the section the "Our Vision" menu item points at.
 *
 * The layout is one idea: two statements on navy, each with a white card that hangs off
 * the bottom edge of the navy band and lands on the page background below it. The cards
 * are not inside the navy block and are not below it — they straddle the join, which is
 * what ties a statement to its explanation without drawing a box around both.
 *
 * That effect is built from a navy block with oversized bottom padding, and a card row
 * pulled back up over it with a negative margin. The padding and the margin are a PAIR:
 * change one and the cards either float free of the navy or sink into it. They are
 * written as matching values at each breakpoint for that reason.
 *
 * `items-stretch` on the card grid, with `h-full` on each card, keeps the two the same
 * height when one body runs a line longer — otherwise the shorter card's bottom edge
 * sits above its neighbour's and the join reads as misaligned rather than deliberate.
 */
export function Vision() {
  return (
    <section id="vision" className="bg-surface">
      {/* Navy band. The bottom padding is the room the cards hang into. */}
      <div className="bg-base pb-[7.5rem] pt-16 md:pb-[8.5rem] md:pt-24">
        <Container wide>
          <div className="grid gap-10 md:grid-cols-2 md:gap-0">
            {visionPillars.map((p, i) => (
              <Reveal key={p.tag} delay={i * 0.08}>
                {/* The rule divides the two statements, so it belongs to the second
                    column and only exists once they are side by side. */}
                <div className={i === 0 ? 'md:pr-10 lg:pr-16' : 'md:border-l md:border-surface/20 md:pl-10 lg:pl-16'}>
                  <span className="inline-block rounded-full bg-accent px-4 py-1.5 font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-accent-ink">
                    {p.tag}
                  </span>
                  <h2 className="mt-5 max-w-md font-sans text-3xl font-bold leading-[1.15] tracking-[-0.01em] text-surface md:text-[2.6rem]">
                    {p.statement}
                  </h2>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </div>

      {/* Cards, pulled back up over the navy. Matches the padding above. */}
      <Container wide className="relative -mt-[6rem] pb-16 md:-mt-[7rem] md:pb-24">
        <div className="grid items-stretch gap-6 md:grid-cols-2 md:gap-8">
          {visionPillars.map((p, i) => (
            <Reveal key={p.cardLabel} delay={i * 0.08}>
              <div className="h-full border-t-[3px] border-accent bg-surface p-6 shadow-card md:p-8">
                {/* text-ink, never text-base. `base` is both a colour and a font-size
                    step in tailwind.config.ts, so `.text-base` is emitted twice and
                    whichever lands later wins — the config says as much on the `ink`
                    token. It is the same collision that made the About menu item
                    invisible on hover. */}
                <p className="font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-ink">
                  {p.cardLabel}
                </p>
                <p className="mt-4 leading-relaxed text-muted">{p.cardBody}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}
