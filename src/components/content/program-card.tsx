import Link from 'next/link'

import type { ProgramPageData } from '@/lib/data/programs'
import { cn } from '@/lib/utils/cn'

function courseList(names: string[]): string {
  return names.length > 1
    ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`
    : (names[0] ?? '')
}

/** A programme as a large colour panel: peach, or teal for the second of a pair. */
export function ProgramCard({
  data,
  tone = 'peach',
}: {
  data: ProgramPageData
  tone?: 'peach' | 'teal'
}) {
  const { program, courses } = data
  const teal = tone === 'teal'
  return (
    <Link
      href={program.path}
      className={cn(
        'group flex h-full flex-col rounded-panel p-7 transition-shadow duration-150 hover:shadow-card sm:p-9',
        teal ? 'bg-accent-strong text-on-accent' : 'bg-accent-soft text-accent-strong',
      )}
      data-track-area="card"
    >
      <h3 className="text-[1.625rem] leading-9 font-semibold">{program.shortName} qualifier</h3>
      {courses.length > 0 ? (
        <p className={cn('mt-3 text-body', teal ? 'text-on-accent/80' : 'text-text')}>
          Week-by-week help for {courseList(courses.map((course) => course.shortName))}.
        </p>
      ) : null}
      <span
        className={cn(
          'mt-auto pt-8 text-small font-semibold underline underline-offset-4',
          teal ? 'decoration-on-accent/40' : 'decoration-accent-strong/30',
          'group-hover:decoration-current',
        )}
      >
        Open {program.shortName}
      </span>
    </Link>
  )
}
