'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils/cn'

/**
 * The header bar. On the homepage it takes the hero's green so the two read
 * as one band; its links and buttons switch with `group-data-[tone=dark]/header:`.
 */
export function HeaderShell({ children }: { children: ReactNode }) {
  const dark = usePathname() === '/'
  return (
    <header
      data-tone={dark ? 'dark' : 'light'}
      data-print="hide"
      className={cn(
        'group/header sticky top-0 z-40 border-b',
        dark
          ? 'border-on-accent/10 bg-accent-strong [--logo-dot:var(--accent-strong)] [--logo-stroke:var(--accent-strong)] [--logo-tile:var(--lime)]'
          : 'border-border bg-bg/95 backdrop-blur-md supports-[backdrop-filter]:bg-bg/85',
      )}
    >
      {children}
    </header>
  )
}
