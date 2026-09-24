import { ChevronDown } from 'lucide-react'
import Link from 'next/link'

import { Disclosure } from '@/components/ui/disclosure'
import type { ProgramRef } from '@/lib/data/types'

export function ProgrammeSwitcher({
  programs,
}: {
  programs: Array<ProgramRef & { description: string | null }>
}) {
  if (programs.length === 0) return null
  return (
    <Disclosure
      label="Choose a programme"
      summaryClassName="flex min-h-11 cursor-pointer items-center gap-1 px-3 text-small font-medium text-text hover:text-accent-ink"
      summary={
        <>
          Programmes
          <ChevronDown
            aria-hidden="true"
            className="size-4 transition-transform group-open:rotate-180"
          />
        </>
      }
      panelClassName="absolute left-0 top-full z-50 mt-2 w-72 rounded-card border border-border bg-card p-2 shadow-card"
    >
      <ul>
        {programs.map((program) => (
          <li key={program.id}>
            <Link
              href={program.path}
              className="block rounded-control px-3 py-3 hover:bg-surface"
              data-track="nav_click"
              data-track-label={`programme:${program.slug}`}
            >
              <span className="block text-small font-semibold text-text">{program.shortName}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Disclosure>
  )
}
