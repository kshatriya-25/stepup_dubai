import { Container } from '@/components/primitives/Container'
import { Reveal } from '@/components/primitives/Reveal'
import { story } from '@/content/home'

/** "Our Vision" — the original's green block with a magenta heading. */
export function OurStory() {
  return (
    <section id="story" className="relative overflow-hidden bg-accent text-accent-ink">
      {/* subtle grid texture so the flat green reads richer */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(#000 1px,transparent 1px),linear-gradient(90deg,#000 1px,transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <Container className="relative py-20 text-center md:py-28">
        <Reveal>
          <h2 className="font-sans text-4xl font-bold uppercase leading-none tracking-[-0.01em] text-magenta md:text-6xl">
            {story.title}
          </h2>
        </Reveal>
        <Reveal delay={0.12}>
          <p className="mx-auto mt-8 max-w-3xl text-xl font-medium leading-relaxed text-accent-ink md:text-2xl">
            {story.body}
          </p>
        </Reveal>
      </Container>
    </section>
  )
}
