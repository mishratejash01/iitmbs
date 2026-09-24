import Link from 'next/link'

import { cn } from '@/lib/utils/cn'

export type TabNavItem = { href: string; label: string; current?: boolean }

/**
 * A row of text links with an underline for the current one: used for exam,
 * category and section filters. Scrolls sideways on narrow screens.
 */
export function TabNav({ items, label }: { items: TabNavItem[]; label: string }) {
  if (items.length === 0) return null
  return (
    <nav aria-label={label} className="no-scrollbar -mx-1 overflow-x-auto" data-print="hide">
      <ul className="flex min-w-max gap-1 border-b border-border px-1">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={item.current ? 'page' : undefined}
              className={cn(
                '-mb-px flex min-h-12 items-center border-b-2 px-3 text-small whitespace-nowrap',
                item.current
                  ? 'border-accent-strong font-semibold text-accent-strong'
                  : 'border-transparent font-medium text-muted hover:border-border-strong hover:text-text',
              )}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
