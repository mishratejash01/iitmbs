import { CheckCircle2, CircleDashed } from 'lucide-react'
import Link from 'next/link'

import { PageContext } from '@/components/analytics/page-context'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import type { ProgramWeekData } from '@/lib/data/weeks'
import { cn } from '@/lib/utils/cn'

function Row({ href, label, available }: { href: string | null; label: string; available: boolean }) {
  const Icon = available ? CheckCircle2 : CircleDashed
  const content = (
    <>
      <Icon aria-hidden="true" className={cn('size-4 shrink-0', available ? 'text-success' : 'text-muted')} />
      <span>{label}</span>
      {!available ? <span className="text-xs text-muted">(coming soon)</span> : null}
    </>
  )
  return href && available ? (
    <Link href={href} className="flex min-h-10 items-center gap-2 text-small font-medium text-accent-ink hover:underline">
      {content}
    </Link>
  ) : (
    <span className="flex min-h-10 items-center gap-2 text-small text-muted">{content}</span>
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
        eyebrow={data.programName}
        title={title}
        description={`Week ${data.weekNumber} of every ${data.programShortName} qualifier course in one place — notes, graded assignment hints and practice.`}
        meta={
          <nav aria-label="Other weeks" className="flex flex-wrap gap-2">
            {data.weeks.map((n) => (
              <Link
                key={n}
                href={`/${data.programSlug}/week-${n}`}
                aria-current={n === data.weekNumber ? 'page' : undefined}
                className={cn(
                  'inline-flex min-h-10 items-center rounded-full border px-4 text-small font-medium',
                  n === data.weekNumber ? 'border-accent bg-accent-soft text-accent-ink' : 'border-border bg-card text-text hover:border-accent',
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
          <EmptyState title="No courses yet" description="Course pages will appear here once they are published." />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {data.courses.map((course) => (
              <li key={course.coursePath} className="rounded-card border border-border bg-card p-4 sm:p-5">
                <p className="text-small font-medium text-accent-ink">{course.name}</p>
                <h2 className="mt-0.5 font-semibold text-text">
                  {course.week ? (
                    <Link href={course.week.path} className="hover:text-accent-ink">
                      {course.shortName} Week {data.weekNumber}: {course.week.title}
                    </Link>
                  ) : (
                    `${course.shortName} Week ${data.weekNumber}`
                  )}
                </h2>
                <div className="mt-3 divide-y divide-border">
                  <Row href={course.graded?.path ?? null} label="Graded assignment" available={Boolean(course.graded?.path)} />
                  <Row href={course.weekNote?.path ?? null} label="Week notes" available={Boolean(course.weekNote)} />
                  <Row href={course.practice?.path ?? null} label="Practice assignment" available={Boolean(course.practice?.path)} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
