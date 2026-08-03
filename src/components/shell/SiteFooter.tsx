import { site, socials } from '@/content/site'
import { Container } from '@/components/primitives/Container'

export function SiteFooter() {
  return (
    <>
      <footer id="footer" className="bg-base text-surface">
        <Container wide className="grid gap-12 py-14 md:grid-cols-[1.6fr_1fr_1fr] md:gap-8 md:py-16 lg:gap-12">
          {/* Brand */}
          <div className="flex flex-col gap-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo.png" alt="Tier-2 Rising Startup Summit" className="h-16 w-auto md:h-20" />
            <p className="max-w-sm text-sm leading-relaxed text-surface/70">
              A flagship event under the Tier-2 Rising campaign by NammaOffice — building a funding-ready startup
              ecosystem beyond the metros.
            </p>
            <p className="text-sm font-semibold text-surface/90">
              {site.dates} · {site.venue}, {site.city}
            </p>
          </div>

          {/* Explore */}
          <div className="flex flex-col gap-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Explore</p>
            <nav className="flex flex-col gap-2.5 text-sm">
              {['Our Vision', 'Growth Zones', 'Key Initiatives', 'Partners', 'Who Attends'].map(
                (l) => (
                  <a
                    key={l}
                    href={`#${l.toLowerCase().replace(/[^a-z]+/g, '-').replace(/(^-|-$)/g, '')}`}
                    className="w-fit text-surface/70 transition-colors hover:text-accent"
                  >
                    {l}
                  </a>
                ),
              )}
            </nav>
          </div>

          {/* Connect */}
          <div className="flex flex-col gap-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Connect</p>
            <a href={`mailto:${site.contactEmail}`} className="w-fit text-sm text-surface/70 transition-colors hover:text-accent">
              {site.contactEmail}
            </a>
            <div className="mt-1 flex flex-col gap-2.5 text-sm">
              {socials.map((s) => (
                <a key={s.label} href={s.href} className="w-fit text-surface/70 transition-colors hover:text-accent">
                  {s.label}
                </a>
              ))}
            </div>
          </div>
        </Container>
      </footer>

      {/* Copyright bar */}
      <div className="bg-accent">
        <Container wide className="flex flex-col items-center justify-between gap-2 py-3 sm:flex-row">
          <p className="font-sans text-sm font-bold uppercase text-accent-ink">
            © 2026 {site.fullName} · {site.initiativeBy}
          </p>
          <p className="text-sm font-bold uppercase text-accent-ink/80">Technology partner · TealOrca</p>
        </Container>
      </div>
    </>
  )
}
