import { Menu, X } from 'lucide-react'
import Link from 'next/link'

import { Disclosure } from '@/components/ui/disclosure'
import type { NavItem } from '@/lib/data/navigation'
import type { ProgramRef } from '@/lib/data/types'

export function MobileMenu({ items, programs }: { items: NavItem[]; programs: ProgramRef[] }) {
  const linkClass =
    'flex min-h-12 items-center border-b border-border px-1 text-body font-medium text-text hover:text-accent-ink'
  return (
    <Disclosure
      className="lg:hidden"
      label="Menu"
      summaryClassName="flex size-11 cursor-pointer items-center justify-center rounded-control text-text hover:bg-surface"
      summary={
        <>
          <Menu aria-hidden="true" className="size-6 group-open:hidden" />
          <X aria-hidden="true" className="hidden size-6 group-open:block" />
        </>
      }
      panelClassName="fixed inset-x-0 top-[4.5rem] z-50 max-h-[calc(100dvh-4.5rem)] overflow-y-auto border-b border-border bg-bg px-4 pb-8 pt-2 shadow-card"
    >
      <nav aria-label="Mobile">
        <p className="px-1 pt-4 pb-1 text-xs font-semibold tracking-wide text-accent-ink uppercase">
          Programmes
        </p>
        <ul>
          {programs.map((program) => (
            <li key={program.id}>
              <Link
                href={program.path}
                className={linkClass}
                data-track="nav_click"
                data-track-label={`mobile:${program.slug}`}
              >
                {program.shortName}
              </Link>
            </li>
          ))}
        </ul>
        <p className="px-1 pt-6 pb-1 text-xs font-semibold tracking-wide text-accent-ink uppercase">
          Explore
        </p>
        <ul>
          {items
            .filter((item) => !programs.some((p) => p.path === item.href))
            .map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={linkClass}
                  data-track="nav_click"
                  data-track-label={`mobile:${item.label}`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          <li>
            <Link
              href="/search"
              className={linkClass}
              data-track="nav_click"
              data-track-label="mobile:search"
            >
              Search
            </Link>
          </li>
        </ul>
      </nav>
    </Disclosure>
  )
}
