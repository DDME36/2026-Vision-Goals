import { cn } from '@/lib/utils'

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('size-8', className)} aria-hidden>
      <rect width="32" height="32" rx="9" className="fill-foreground" />
      <circle cx="16" cy="16" r="9.25" fill="none" strokeWidth="1.75" className="stroke-background/20" />
      <path d="M16 6.75a9.25 9.25 0 1 1-8.8 6.4" fill="none" strokeWidth="1.75" strokeLinecap="round" className="stroke-brand" />
      <circle cx="16" cy="16" r="4.75" fill="none" strokeWidth="1.5" className="stroke-background" />
      <circle cx="16" cy="16" r="1.6" className="fill-brand" />
    </svg>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className="text-[15px] font-semibold tracking-tight">Vision Goals</span>
        <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">by Zentyr</span>
      </span>
    </span>
  )
}
