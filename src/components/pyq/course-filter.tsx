'use client'

import { Search } from 'lucide-react'
import { useId, useState } from 'react'

import { LinkList } from '@/components/content/link-list'
import { SectionHeading } from '@/components/ui/section-heading'

export type FilterGroup = {
  id: string
  heading: string
  items: Array<{ path: string; title: string; search: string }>
}

/** Course lists by level with a type-to-filter box ("mlt", "bscs2007", "python"). */
export function CourseFilter({ groups }: { groups: FilterGroup[] }) {
  const [query, setQuery] = useState('')
  const inputId = useId()
  const q = query.trim().toLowerCase()
  const visible = groups
    .map((group) => ({
      ...group,
      items: q ? group.items.filter((item) => item.search.includes(q)) : group.items,
    }))
    .filter((group) => group.items.length > 0)

  return (
    <>
      <div className="container-reading" data-print="hide">
        <label htmlFor={inputId} className="sr-only">
          Find a course
        </label>
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted"
          />
          <input
            id={inputId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find a course: MLT, Stats 2, BSCS2007…"
            autoComplete="off"
            className="min-h-12 w-full rounded-control border border-border-strong bg-card pr-4 pl-10 text-text placeholder:text-muted focus-visible:border-accent"
          />
        </div>
      </div>
      {visible.map((group) => (
        <section key={group.id} aria-labelledby={group.id} className="container-reading">
          <SectionHeading id={group.id} title={group.heading} />
          <LinkList label={group.heading} items={group.items} />
        </section>
      ))}
      {q && visible.length === 0 ? (
        <p role="status" className="container-reading text-muted">
          No course matches “{query.trim()}”.
        </p>
      ) : null}
    </>
  )
}
