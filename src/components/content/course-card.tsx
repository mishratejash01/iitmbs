import Link from 'next/link'

import type { CourseCard as CourseCardData } from '@/lib/data/programs'

/** A course as a soft peach panel: code, name and length. */
export function CourseCard({
  course,
  headingLevel = 'h3',
}: {
  course: CourseCardData
  headingLevel?: 'h2' | 'h3'
}) {
  const Heading = headingLevel
  return (
    <Link
      href={course.path}
      className="group flex h-full flex-col rounded-card bg-surface p-6 transition-colors duration-150 hover:bg-accent-soft sm:p-7"
      data-track-area="card"
    >
      {course.code ? (
        <span className="text-xs font-semibold tracking-wide text-accent-ink uppercase">
          {course.code}
        </span>
      ) : null}
      <Heading className="mt-1 text-h3 font-semibold text-text group-hover:underline">
        {course.name}
      </Heading>
      <p className="mt-auto pt-6 text-small text-muted">
        {course.shortName} · {course.weeksCount} weeks
        {course.homeProgram ? ` · from ${course.homeProgram}` : ''}
      </p>
    </Link>
  )
}
