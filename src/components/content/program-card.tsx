import { ArrowRight } from 'lucide-react'

import { LinkCard } from '@/components/ui/card'
import type { ProgramPageData } from '@/lib/data/programs'

export function ProgramCard({ data }: { data: ProgramPageData }) {
  const { program, courses } = data
  return (
    <LinkCard
      href={program.path}
      className="flex h-full flex-col p-5 sm:p-6"
      data-track-area="card"
    >
      <p className="text-small font-medium text-accent-ink">{program.name}</p>
      <h3 className="mt-1 text-h3 font-semibold text-text">{program.shortName} qualifier</h3>
      {courses.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Qualifier courses">
          {courses.map((course) => (
            <li
              key={course.id}
              className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-text"
            >
              {course.shortName}
            </li>
          ))}
        </ul>
      ) : null}
      <span className="mt-auto inline-flex items-center gap-1 pt-5 text-small font-medium text-accent-ink">
        Open week-by-week help
        <ArrowRight
          aria-hidden="true"
          className="size-4 transition-transform group-hover:translate-x-0.5"
        />
      </span>
    </LinkCard>
  )
}
