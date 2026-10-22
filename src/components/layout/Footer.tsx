import { BRAND, BRAND_URL } from '@/lib/config'

export function Footer() {
  const brand = BRAND_URL ? (
    <a href={BRAND_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-foreground/80 hover:text-brand">
      {BRAND}
    </a>
  ) : (
    <span className="font-semibold text-foreground/80">{BRAND}</span>
  )
  return (
    <footer className="safe-bottom py-8 text-center text-xs text-muted-foreground">
      <p>
        Crafted with care by {brand} · © {new Date().getFullYear()}
      </p>
    </footer>
  )
}
