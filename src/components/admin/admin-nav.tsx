'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils/cn'

export type AdminNavGroup = { label: string; links: Array<{ href: string; label: string }> }

/** Sidebar on wide screens, a horizontally scrolling strip on phones. */
export function AdminNav({ groups }: { groups: AdminNavGroup[] }) {
  const pathname = usePathname()
  const isActive = (href: string) =>
    href === '/admin' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)

  return (
    <nav aria-label="Admin">
      <div className="no-scrollbar -mx-4 overflow-x-auto px-4 lg:hidden">
        <ul className="flex gap-1 border-b border-border">
          {groups
            .flatMap((group) => group.links)
            .map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isActive(link.href) ? 'page' : undefined}
                  className={cn(
                    '-mb-px flex min-h-11 items-center border-b-2 px-3 text-small font-medium whitespace-nowrap',
                    isActive(link.href)
                      ? 'border-accent text-text'
                      : 'border-transparent text-muted hover:text-text',
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
        </ul>
      </div>
      <div className="hidden space-y-6 lg:block">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="px-3 text-xs font-semibold tracking-wide text-muted uppercase">
              {group.label}
            </p>
            <ul className="mt-2 space-y-0.5">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={isActive(link.href) ? 'page' : undefined}
                    className={cn(
                      'flex min-h-9 items-center rounded-control px-3 text-small',
                      isActive(link.href)
                        ? 'bg-accent-soft font-medium text-accent-ink'
                        : 'text-text hover:bg-surface',
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  )
}
