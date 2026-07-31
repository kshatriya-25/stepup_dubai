'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, ArrowRight } from 'lucide-react'
import { participateRoutes } from '@/content/site'

const Ctx = createContext<{ open: () => void; close: () => void } | null>(null)

export function useParticipate() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useParticipate must be used within ParticipateProvider')
  return ctx
}

export function ParticipateProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false)
  return (
    <Ctx.Provider value={{ open: () => setOpen(true), close: () => setOpen(false) }}>
      {children}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: 'rgba(7,43,95,0.55)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setOpen(false)}
          >
            <motion.div
              className="w-full max-w-3xl bg-accent p-8 sm:p-12"
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="flex items-start justify-between">
                <h2 className="font-sans text-4xl font-bold uppercase text-accent-ink">Participate</h2>
                <button aria-label="Close" onClick={() => setOpen(false)} className="text-accent-ink">
                  <X size={28} />
                </button>
              </div>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {participateRoutes.map((r) => (
                  <a
                    key={r.label}
                    href={r.href}
                    onClick={() => setOpen(false)}
                    className="group flex items-center justify-between border border-base/20 bg-base px-5 py-5 text-surface transition-colors hover:bg-base-2"
                  >
                    <span>
                      <span className="block font-sans text-lg font-bold uppercase">{r.label}</span>
                      <span className="block text-sm text-surface/70">{r.desc}</span>
                    </span>
                    <ArrowRight size={20} className="shrink-0 transition-transform group-hover:translate-x-1" />
                  </a>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Ctx.Provider>
  )
}
