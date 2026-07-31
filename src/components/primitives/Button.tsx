import { cn } from '@/lib/cn'
import type { ReactNode } from 'react'

type Variant = 'solid' | 'ghost' | 'dark' | 'outline'

const base =
  'inline-flex items-center justify-center gap-2 px-7 py-3.5 font-sans text-btn uppercase leading-none transition-colors duration-150 rounded-none cursor-pointer'

const variants: Record<Variant, string> = {
  // primary CTA — accent block, dark ink, inverts to base on hover (like STEP green→black)
  solid: 'bg-accent text-accent-ink hover:bg-base hover:text-surface',
  // nav participate — transparent, accent text
  ghost: 'bg-transparent text-accent hover:text-surface',
  // get-in-touch style — dark bg, accent text
  dark: 'bg-base text-accent hover:bg-accent hover:text-accent-ink',
  // outline — accent border/text, fills on hover
  outline: 'border border-accent bg-transparent text-accent hover:bg-accent hover:text-accent-ink',
}

export function Button({
  children,
  variant = 'solid',
  href,
  onClick,
  className,
  full,
  target,
}: {
  children: ReactNode
  variant?: Variant
  href?: string
  onClick?: () => void
  className?: string
  full?: boolean
  target?: string
}) {
  const cls = cn(base, variants[variant], full && 'w-full', className)
  if (href) {
    return (
      <a href={href} target={target} rel={target === '_blank' ? 'noopener noreferrer' : undefined} className={cls}>
        {children}
      </a>
    )
  }
  return (
    <button onClick={onClick} className={cls}>
      {children}
    </button>
  )
}
