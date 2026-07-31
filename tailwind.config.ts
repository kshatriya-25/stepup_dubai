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
        // === PASS 1 — faithful STEP Dubai palette ===
        // (Pass 2 = swap this block for Tier-2: base #072B5F, accent #F47B20, etc.)
        base: '#000000',        // black — nav, hero card, scores strip
        'base-2': '#171333',    // indigo — countdown numbers, secondary dark
        accent: '#00FF00',      // electric green — primary accent (flat blocks, buttons)
        'accent-ink': '#000000',// black text/icons that sit on the green
        surface: '#FFFFFF',
        foam: '#F9F7F1',        // warm off-white footer
        magenta: '#E93CF7',     // "Our Story" heading pop
        mint: '#73ECCF',        // secondary accent (testimonial text)
        teal: '#1DE6C7',
        gold: '#F2B705',
        cyan: '#00AEEF',
        purple: '#6B3FA0',
        ink: '#000000',         // body text on light
        muted: '#4A4A4A',       // secondary text
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
