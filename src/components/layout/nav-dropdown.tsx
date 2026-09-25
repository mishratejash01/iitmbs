import { ChevronDown } from 'lucide-react'
import Link from 'next/link'

import { Disclosure } from '@/components/ui/disclosure'
import type { NavItem } from '@/lib/data/navigation'

/** A header item with children (nav_items.parent_id), shown as a dropdown like Programmes. */
export function NavDropdown({ item }: { item: NavItem }) {
  return (
    <Disclosure
      label={item.label}
      summaryClassName="flex min-h-11 cursor-pointer items-center gap-1 px-2.5 text-small font-medium whitespace-nowrap xl:px-3 text-text hover:text-accent-ink group-data-[tone=dark]/header:text-on-accent group-data-[tone=dark]/header:hover:text-lime"
      summary={
        <>
          {item.label}
          <ChevronDown
            aria-hidden="true"
            className="size-4 transition-transform group-open:rotate-180"
          />
        </>
      }
      panelClassName="absolute left-0 top-full z-50 mt-2 w-72 rounded-card border border-border bg-card p-2 shadow-card"
    >
      <ul>
        {item.children.map((child) => (
          <li key={child.id}>
            <Link
              href={child.href}
              className="block rounded-control px-3 py-3 hover:bg-surface"
              data-track="nav_click"
              data-track-label={`${item.label}:${child.label}`}
              {...(child.openInNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              <span className="block text-small font-semibold text-text">{child.label}</span>
              {child.description ? (
                <span className="mt-0.5 block text-xs text-muted">{child.description}</span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </Disclosure>
  )
}
