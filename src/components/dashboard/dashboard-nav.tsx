'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils/cn'

const LINKS = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/bookmarks', label: 'Bookmarks' },
  { href: '/dashboard/history', label: 'History' },
  { href: '/dashboard/settings', label: 'Settings' },
]

export function DashboardNav() {
  const pathname = usePathname()
  return (
    <nav aria-label="Dashboard" className="no-scrollbar -mx-4 overflow-x-auto px-4">
      <ul className="flex gap-1 border-b border-border">
        {LINKS.map((link) => {
          const active = pathname === link.href
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  '-mb-px flex min-h-11 items-center border-b-2 px-3 text-small font-medium whitespace-nowrap',
                  active
                    ? 'border-accent-strong text-text'
                    : 'border-transparent text-muted hover:text-text',
                )}
              >
                {link.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
