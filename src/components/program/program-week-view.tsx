import Link from 'next/link'

import { PageContext } from '@/components/analytics/page-context'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import type { ProgramWeekData } from '@/lib/data/weeks'
import { cn } from '@/lib/utils/cn'

function Row({
  href,
  label,
  available,
}: {
  href: string | null
  label: string
  available: boolean
}) {
  return href && available ? (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center text-small font-medium text-accent-ink underline decoration-accent-ink/30 underline-offset-4 hover:decoration-accent-ink"
    >
      {label}
    </Link>
  ) : (
    <span className="inline-flex min-h-11 items-center gap-1.5 text-small text-muted">
      <span>{label}</span>
      {!available ? <span className="text-xs">(coming soon)</span> : null}
    </span>
  )
}

/** /<programme>/week-<n>: the same week across every course of a programme. */
export function ProgramWeekView({ data }: { data: ProgramWeekData }) {
  const title = `IITM BS ${data.programShortName} Week ${data.weekNumber}: Graded Assignments & Notes`
  return (
    <>
      <PageContext type="program_week" />
      <PageHeader
        crumbs={[
          { name: data.programShortName, path: `/${data.programSlug}` },
          { name: `Week ${data.weekNumber}`, path: `/${data.programSlug}/week-${data.weekNumber}` },
        ]}
        title={title}
        meta={
          <nav aria-label="Other weeks" className="flex flex-wrap gap-x-5">
            {data.weeks.map((n) => (
              <Link
                key={n}
                href={`/${data.programSlug}/week-${n}`}
                aria-current={n === data.weekNumber ? 'page' : undefined}
                className={cn(
                  'inline-flex min-h-11 items-center text-small underline-offset-8',
                  n === data.weekNumber
                    ? 'font-semibold text-text underline decoration-accent-strong decoration-2'
                    : 'font-medium text-accent-ink decoration-accent-ink/40 hover:underline',
                )}
              >
                Week {n}
              </Link>
            ))}
          </nav>
        }
      />
      <div className="container-page py-8 sm:py-10">
        {data.courses.length === 0 ? (
          <EmptyState
            title="No courses yet"
            description="Course pages will appear here once they are published."
          />
        ) : (
          <ul className="border-t border-border">
            {data.courses.map((course) => (
              <li key={course.coursePath} className="border-b border-border py-5">
                <p className="text-small font-semibold text-accent-ink">{course.name}</p>
                <h2 className="mt-1 text-h3 font-semibold text-text">
                  {course.week ? (
                    <Link
                      href={course.week.path}
                      className="decoration-accent-ink/40 underline-offset-4 hover:text-accent-ink hover:underline"
                    >
                      {course.shortName} Week {data.weekNumber}: {course.week.title}
                    </Link>
                  ) : (
                    `${course.shortName} Week ${data.weekNumber}`
                  )}
                </h2>
                <div className="mt-1 flex flex-wrap gap-x-6">
                  <Row
                    href={course.graded?.path ?? null}
                    label="Graded assignment"
                    available={Boolean(course.graded?.path)}
                  />
                  <Row
                    href={course.weekNote?.path ?? null}
                    label="Week notes"
                    available={Boolean(course.weekNote)}
                  />
                  <Row
                    href={course.practice?.path ?? null}
                    label="Practice assignment"
                    available={Boolean(course.practice?.path)}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
