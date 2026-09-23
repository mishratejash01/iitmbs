import Link from 'next/link'

import { cn } from '@/lib/utils/cn'

/** Brand mark: an orange tile with a check — "cleared". Decorative only. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn('size-8 shrink-0', className)}>
      <rect width="32" height="32" rx="9" fill="var(--accent)" />
      <path
        d="M9.5 16.5l4.2 4.2L22.5 11.8"
        fill="none"
        stroke="#fff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Logo({ siteName, className }: { siteName: string; className?: string }) {
  return (
    <Link
      href="/"
      className={cn('flex min-h-11 items-center gap-2.5 rounded-control font-semibold text-text', className)}
      data-track="nav_click"
      data-track-label="logo"
    >
      <LogoMark />
      <span className="text-[1.0625rem] tracking-tight">{siteName}</span>
    </Link>
  )
}
