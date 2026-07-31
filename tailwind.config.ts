import type { Config } from 'tailwindcss'

/**
 * Design tokens. STEP Dubai's structure, painted in the Tier-2 Rising brand palette
 * (from source_contents/ Design Brief). This is the ONE file to edit to reskin:
 *   - flip `accent` back to '#00FF00' + `base` to '#000' for the faithful STEP look.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    // Match the original's max-width media-query breakpoints.
    screens: {
      xs: '320px',
      sm: '768px',
      md: '990px',
      lg: '1200px',
      xl: '1600px',
    },
    extend: {
      colors: {
        // === PASS 2 — official Tier-2 Rising palette (Design Brief) ===
        base: '#072B5F',        // Deep Navy — nav, dark sections (bg-base/border-base only)
        'base-2': '#0A3A72',    // lifted navy — hover / secondary dark
        night: '#04162E',       // near-black navy — hero/video overlays
        accent: '#F47B20',      // Rising Orange — primary accent (blocks, buttons)
        'accent-ink': '#072B5F',// navy text/icons on orange (legible; white fails contrast)
        surface: '#FFFFFF',
        foam: '#F4F6FA',        // cool off-white
        green: '#16A05D',       // Growth Green — funding / ecosystem
        gold: '#F2B705',        // Investor Gold — investment / recognition
        cyan: '#00AEEF',        // Tech Cyan — AI / innovation
        purple: '#6B3FA0',      // Startup Purple — pitch arena / VC
        ink: '#0B2447',         // navy-ink — body text + headings on light (use text-ink, NOT text-base)
        muted: '#5A6B82',       // slate — secondary text
      },
      fontFamily: {
        sans: ['var(--font-alexandria)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        hero: ['45px', { lineHeight: '1.05', fontWeight: '700' }],
        'hero-sub': ['22px', { lineHeight: '1.1', fontWeight: '500' }],
        section: ['50px', { lineHeight: '1', fontWeight: '700' }],
        'section-sm': ['34px', { lineHeight: '1', fontWeight: '700' }],
        count: ['42px', { lineHeight: '1', fontWeight: '700' }],
        quote: ['30px', { lineHeight: '1.1', fontWeight: '700' }],
        btn: ['18px', { lineHeight: '1', fontWeight: '700' }],
      },
      maxWidth: {
        container: '1200px',
        'container-wide': '1300px',
      },
      boxShadow: {
        sticky: '0 3px 9px rgba(0,0,0,0.5)',
        card: '0 0 1px rgba(7,43,95,.06), 0 2px 6px rgba(7,43,95,.06), 0 16px 24px rgba(7,43,95,.08)',
      },
      keyframes: {
        fadein: { from: { opacity: '0' }, to: { opacity: '1' } },
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
      },
      animation: {
        fadein: 'fadein 1s ease',
        marquee: 'marquee 28s linear infinite',
      },
    },
  },
  plugins: [],
}

export default config
