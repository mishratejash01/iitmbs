import Link from 'next/link'

import { cn } from '@/lib/utils/cn'

/**
 * Brand mark: a "Q" monogram. Teal on light backgrounds; `inverse` draws it
 * in peach for the teal bands. Decorative only.
 */
export function LogoMark({
  className,
  inverse = false,
}: {
  className?: string
  inverse?: boolean
}) {
  const tile = inverse ? 'var(--accent-soft)' : 'var(--accent-strong)'
  const stroke = inverse ? 'var(--accent-strong)' : '#fff'
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn('size-8 shrink-0', className)}>
      <rect width="32" height="32" rx="8" fill={tile} />
      <circle cx="15.2" cy="15.2" r="7.4" fill="none" stroke={stroke} strokeWidth="3.2" />
      <path d="M19.6 19.6l5 5" stroke={stroke} strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  )
}

export function Logo({ siteName, className }: { siteName: string; className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        'flex min-h-11 items-center gap-2.5 rounded-control font-semibold text-text',
        className,
      )}
      data-track="nav_click"
      data-track-label="logo"
    >
      <LogoMark />
      <span className="text-[1.125rem] tracking-tight text-accent-ink">{siteName}</span>
    </Link>
  )
}
