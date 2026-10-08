import { Container } from '@/components/primitives/Container'
import { Eyebrow, SectionHeading } from '@/components/primitives/SectionHeading'
import { Reveal } from '@/components/primitives/Reveal'
import { speakers, speakersIntro } from '@/content/home'

/**
 * "The People in the Room" — the announced speakers, straight after Why We Built the Room.
 *
 * IT SITS THERE ON PURPOSE. The section above it makes a claim: Tier-2 founders are as good
 * as anyone, they just cannot get into the room. The honest next question is "so who is
 * actually in yours?", and four names with faces and companies answer it before the page
 * starts asking for money. Anywhere further down and the claim stands on its own for too
 * long.
 *
 * WHY THIS IS THE DARKEST BAND ON THE PAGE (`night`, not `base`).
 * Why We Built the Room is already navy. Two `bg-base` sections stacked read as one very
 * long navy block with the heading floating in the middle of it, and the reader loses the
 * boundary. Dropping to #04162E puts a real edge between them, and it earns its keep twice:
 * the cards are `base`, so against `night` they LIFT off the page instead of being outlines
 * drawn on it. The portraits brought their own orange ground, and a darker surround is what
 * keeps four warm rectangles from fighting the section around them.
 *
 * THE PHOTOS ARE PRE-CROPPED, not `object-cover`'d into shape — see scripts/speakers.py for
 * why. The aspect ratio here and the one in that script are the same number written twice;
 * if either moves the other has to.
 */
/**
 * Keep a hyphenated word whole.
 *
 * "i-exceed Technology Solutions" wrapped as "…Development, i-" / "exceed Technology
 * Solutions", because a hyphen is a line-break opportunity and the card is ~200px of text.
 * A lone "i-" hanging off the end of a line reads as a typo in the company's name, which is
 * the one thing a credit must not do.
 *
 * U+2060 WORD JOINER, placed immediately after each hyphen — that is the position the break
 * would have been taken at, and the joiner forbids it. It is a zero-width FORMAT character,
 * so unlike a non-breaking hyphen (U+2011) it needs no glyph and cannot turn into tofu in a
 * font that never anticipated it; Alexandria is a Latin webfont and U+2011 is exactly the
 * kind of codepoint it may not carry.
 *
 * Applied to every hyphen rather than special-casing this one company: "Co-Founder" should
 * not split either, and the next hyphenated name to join the lineup should not need anyone
 * to remember this. Done here rather than by hiding an invisible character in the content
 * file, where the next person to edit the string would delete it without ever seeing it.
 */
function keepHyphensWhole(text: string): string {
  return text.replace(/-/g, '-\u2060')
}

export function Speakers() {
  return (
    <section id="speakers" className="bg-night">
      <Container className="py-16 md:py-24">
        <Reveal>
          <Eyebrow className="text-accent">Capital Access to Tier-2 Startups</Eyebrow>
          <SectionHeading className="mt-4 text-surface">The People in the Room</SectionHeading>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-surface/70">{speakersIntro}</p>
        </Reveal>

        {/*
          TWO UP ON A PHONE, not one — a departure from the house pattern (WhatGoesOn and
          the rest go one-up below `sm`) and the right one here. Those sections are 4:3
          scenes; these are 3:4 PORTRAITS, so at full phone width each photo is ~480px tall
          and the four of them are a scroll nobody finishes. Side by side they read as what
          they are, a lineup, and the whole stage fits in two screens.

          `items-stretch` is the grid default and it is load-bearing: the roles run from
          three words to three lines, so the cards are only the same height if each one
          fills its track and pushes its own accent rule to the bottom.
        */}
        <ul className="mt-12 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4 lg:gap-6">
          {speakers.map((s, i) => (
            <Reveal key={s.name} as="li" delay={(i % 4) * 0.08} className="h-full">
              <article className="group flex h-full flex-col bg-base">
                <div className="relative aspect-[3/4] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.photo}
                    /*
                     * EMPTY ON PURPOSE. The name and the role are the next two lines of
                     * text, so a screen reader that also announced them from here would
                     * read every speaker twice. The portrait carries no information the
                     * card does not already give in words.
                     */
                    alt=""
                    width={600}
                    height={800}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]"
                  />
                </div>

                <div className="flex flex-1 flex-col px-4 pb-5 pt-4 sm:px-5 sm:pb-6 sm:pt-5">
                  {/* Navy on orange, not white — white on #F47B20 is about 2.9:1 and fails.
                      This is the same chip as every other orange marker on the site. */}
                  <span className="w-fit bg-accent px-2.5 py-1 font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-accent-ink">
                    {s.badge}
                  </span>
                  {/* Stepped down for the two-up phone grid, where a card is ~150px wide
                      and 18px would break "Mr. Harish Venkatesh" across three lines. */}
                  <h3 className="mt-3 font-sans text-[15px] font-bold leading-tight text-surface sm:mt-3.5 sm:text-lg">
                    {keepHyphensWhole(s.name)}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-surface/70 sm:text-sm">
                    {keepHyphensWhole(s.role)}
                  </p>
                </div>

                {/* Always drawn, never a hover reveal: it is the card's bottom edge in the
                    client's artwork, and an edge that appears on hover is missing on a
                    phone, where most of this page is read. */}
                <span
                  aria-hidden
                  className="mt-auto h-[3px] w-full bg-accent/80 transition-colors duration-300 group-hover:bg-accent"
                />
              </article>
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  )
}
