import { Container } from '@/components/primitives/Container'
import { Reveal } from '@/components/primitives/Reveal'
import { story } from '@/content/home'

/** "Our Vision" — navy block, orange heading pop, white body (Tier-2 brand). */
export function OurStory() {
  return (
    <section id="story" className="relative overflow-hidden bg-base text-surface">
      {/* subtle grid texture so the flat navy reads richer */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      {/* orange glow accent */}
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />

      <Container className="relative py-20 text-center md:py-28">
        <Reveal>
          <h2 className="font-sans text-4xl font-bold uppercase leading-none tracking-[-0.01em] text-accent md:text-6xl">
            {story.title}
          </h2>
        </Reveal>
        <Reveal delay={0.12}>
          <p className="mx-auto mt-8 max-w-3xl text-xl font-medium leading-relaxed text-surface/90 md:text-2xl">
            {story.body}
          </p>
        </Reveal>
      </Container>
    </section>
  )
}
