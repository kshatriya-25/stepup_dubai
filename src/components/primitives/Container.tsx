import { cn } from '@/lib/cn'
import type { ReactNode } from 'react'

export function Container({ children, className, wide }: { children: ReactNode; className?: string; wide?: boolean }) {
  return (
    <div className={cn('mx-auto w-full px-4 sm:px-6', wide ? 'max-w-container-wide' : 'max-w-container', className)}>
      {children}
    </div>
  )
}
