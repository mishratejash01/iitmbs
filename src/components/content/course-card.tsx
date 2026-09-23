import { ArrowRight } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { LinkCard } from '@/components/ui/card'
import type { CourseCard as CourseCardData } from '@/lib/data/programs'

export function CourseCard({
  course,
  headingLevel = 'h3',
}: {
  course: CourseCardData
  headingLevel?: 'h2' | 'h3'
}) {
  const Heading = headingLevel
  return (
    <LinkCard href={course.path} className="flex h-full flex-col" data-track-area="card">
      <div className="flex items-start justify-between gap-3">
        <Heading className="font-semibold text-text group-hover:text-accent-ink">
          {course.name}
        </Heading>
        {course.code ? <Badge tone="accent">{course.code}</Badge> : null}
      </div>
      {course.description ? (
        <p className="mt-2 line-clamp-3 text-small text-muted">{course.description}</p>
      ) : null}
      <div className="mt-auto flex items-center justify-between pt-4 text-small">
        <span className="text-muted">
          {course.shortName} · {course.weeksCount} weeks
          {course.homeProgram ? ` · from ${course.homeProgram}` : ''}
        </span>
        <ArrowRight
          aria-hidden="true"
          className="size-4 text-accent-ink transition-transform group-hover:translate-x-0.5"
        />
      </div>
    </LinkCard>
  )
}
