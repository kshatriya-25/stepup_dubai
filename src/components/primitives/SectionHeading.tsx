import { cn } from '@/lib/cn'

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn('flex items-center gap-3 font-sans text-sm font-bold uppercase tracking-[0.18em]', className)}>
      <span className="inline-block h-[2px] w-8 bg-current" />
      {children}
    </p>
  )
}

/** STEP treatment: Alexandria 700, uppercase, near-normal tracking (NOT 900/condensed). */
export function SectionHeading({
  children,
  className,
  as: Tag = 'h2',
}: {
  children: React.ReactNode
  className?: string
  as?: 'h1' | 'h2' | 'h3'
}) {
  return (
    <Tag
      className={cn(
        'font-sans text-4xl font-bold uppercase leading-[1.02] tracking-[-0.01em] md:text-6xl',
        className,
      )}
    >
      {children}
    </Tag>
  )
}
