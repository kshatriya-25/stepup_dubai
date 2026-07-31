'use client'

import { useEffect, useState, Fragment } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { Container } from '@/components/primitives/Container'
import { speakers } from '@/content/home'

const gradients = [
  'linear-gradient(160deg,#072B5F,#0A356F)',
  'linear-gradient(160deg,#6B3FA0,#072B5F)',
  'linear-gradient(160deg,#00AEEF,#072B5F)',
  'linear-gradient(160deg,#16A05D,#072B5F)',
  'linear-gradient(160deg,#F47B20,#072B5F)',
  'linear-gradient(160deg,#0A356F,#04203f)',
]

function useColumns() {
  const [cols, setCols] = useState(4)
  useEffect(() => {
    const set = () => setCols(window.innerWidth < 990 ? 2 : 4)
    set()
    window.addEventListener('resize', set)
    return () => window.removeEventListener('resize', set)
  }, [])
  return cols
}

export function Speakers() {
  const cols = useColumns()
  const [open, setOpen] = useState<number | null>(null)

  // last index of the row that contains the open card (Codrops-style inline expander)
  const rowEnd = open === null ? -1 : Math.min(Math.floor(open / cols) * cols + cols - 1, speakers.length - 1)

  return (
    <section id="speakers" className="bg-surface">
      {/* header band, like the original green speaker band */}
      <div className="bg-accent">
        <Container className="py-8 text-center">
          <h2 className="font-sans text-3xl font-bold uppercase text-accent-ink md:text-4xl">
            Speakers
          </h2>
          <p className="mt-2 text-sm font-medium uppercase tracking-wide text-accent-ink/70">
            A practitioner-heavy line-up — announced soon
          </p>
        </Container>
      </div>

      <Container className="py-4">
        <div className="grid grid-cols-2 gap-1.5 py-6 md:grid-cols-4">
          {speakers.map((sp, i) => (
            <Fragment key={sp.name}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="group relative block aspect-[3/4] w-full overflow-hidden text-left"
                style={{ background: gradients[i % gradients.length] }}
              >
                {/* initials monogram as placeholder for a headshot */}
                <span className="absolute inset-0 flex items-center justify-center font-sans text-6xl font-black text-surface/10">
                  {sp.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                </span>
                <span className="absolute inset-0 bg-gradient-to-b from-transparent to-base/90 opacity-80 transition-opacity group-hover:opacity-100" />
                <span className="absolute inset-x-0 bottom-0 p-4">
                  <span className="block font-sans text-lg font-bold uppercase leading-tight text-surface">{sp.name}</span>
                  <span className="mt-1 block text-xs text-accent">{sp.role}</span>
                </span>
              </button>

              {i === rowEnd && open !== null && (
                <AnimatePresence>
                  <motion.div
                    key="expander"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                    className="col-span-2 overflow-hidden md:col-span-4"
                  >
                    <div className="relative my-1.5 flex flex-col gap-6 bg-base p-8 text-surface sm:flex-row">
                      <div
                        className="flex h-40 w-40 shrink-0 items-center justify-center font-sans text-4xl font-black text-surface/20"
                        style={{ background: gradients[open % gradients.length] }}
                      >
                        {speakers[open].name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                      </div>
                      <div className="max-w-2xl">
                        <h3 className="font-sans text-2xl font-bold uppercase">{speakers[open].name}</h3>
                        <p className="mt-1 font-medium text-accent">{speakers[open].role}</p>
                        <p className="mt-4 text-surface/75">
                          Speaker to be announced. Drop the confirmed speaker&apos;s photo and bio into this slot.
                        </p>
                      </div>
                      <button
                        aria-label="Close"
                        onClick={() => setOpen(null)}
                        className="absolute right-4 top-4 text-accent hover:text-surface"
                      >
                        <X size={24} />
                      </button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}
            </Fragment>
          ))}
        </div>
      </Container>
    </section>
  )
}
