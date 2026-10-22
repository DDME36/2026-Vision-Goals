import { cn } from '@/lib/utils'

export function Avatar({ name, src, className }: { name: string; src?: string | null; className?: string }) {
  const safeSrc = src && (src.startsWith('data:image/') || src.startsWith('https://')) ? src : null
  return (
    <span
      className={cn(
        'inline-flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-brand/80 to-brand text-xs font-semibold text-brand-foreground ring-2 ring-background',
        className,
      )}
    >
      {safeSrc ? (
        // eslint-disable-next-line @next/next/no-img-element -- data URLs can't go through next/image
        <img src={safeSrc} alt={name} className="size-full object-cover" />
      ) : (
        name.trim().charAt(0).toUpperCase() || '?'
      )}
    </span>
  )
}
