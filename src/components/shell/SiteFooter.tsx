import { Linkedin, Instagram, Youtube } from 'lucide-react'
import { site, socials, type Social } from '@/content/site'
import { Container } from '@/components/primitives/Container'

/**
 * lucide-react ships linkedin/instagram/youtube but no X — only the retired Twitter
 * bird, which would be wrong next to three current marks. So X is inlined.
 */
function SocialIcon({ icon }: { icon: Social['icon'] }) {
  const size = 18
  if (icon === 'linkedin') return <Linkedin size={size} />
  if (icon === 'instagram') return <Instagram size={size} />
  if (icon === 'youtube') return <Youtube size={size} />
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

export function SiteFooter() {
  return (
    <>
      <footer id="footer" className="bg-base text-surface">
        <Container wide className="grid gap-12 py-14 md:grid-cols-[1.6fr_1fr_1fr] md:gap-8 md:py-16 lg:gap-12">
          {/* Brand */}
          <div className="flex flex-col gap-5">
            {/*
              Constrain the WIDTH, not the height. This is a `flex flex-col` column, so
              the cross axis is horizontal and the default `align-items: stretch` pulls a
              `w-auto` image out to the full column width — which is what was skewing the
              logo. An explicit width resists that, and `h-auto` keeps the native 623×401
              ratio. The rendered sizes are 150×97 and 200×129.
            */}
            {/* Centred over the text block, not the whole grid column — the column is
                wider than the copy, so `self-center` alone would push the logo well
                right of the paragraph it sits above. The wrapper matches the
                paragraph's max-w-sm and centres the logo inside that. */}
            <div className="flex w-full max-w-sm justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/logo-v2.png"
                alt="Tier-2 Rising Startup Summit"
                width={600}
                height={386}
                className="h-auto w-[150px] max-w-full md:w-[200px]"
              />
            </div>
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
            {/* tel: needs the digits unspaced to dial reliably; the label keeps the spacing. */}
            <a
              href={`tel:${site.contactPhone.replace(/[^\d+]/g, '')}`}
              className="w-fit text-sm text-surface/70 transition-colors hover:text-accent"
            >
              {site.contactPhone}
            </a>
            {/* Icons on one row. `aria-label` carries the name the visible text used
                to provide — an icon-only link is unlabelled to a screen reader
                otherwise. The 40px box is the tap target, not decoration. */}
            <div className="mt-2 flex items-center gap-2.5">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  title={s.label}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex h-10 w-10 items-center justify-center border border-surface/20 text-surface/70 transition-colors hover:border-accent hover:text-accent"
                >
                  <SocialIcon icon={s.icon} />
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
