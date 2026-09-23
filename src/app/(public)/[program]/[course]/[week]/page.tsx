import { BookOpen, CalendarClock, ClipboardCheck, ExternalLink, PenLine } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { PageContext } from '@/components/analytics/page-context'
import { BookmarkButton } from '@/components/content/bookmark-button'
import { FaqAccordion } from '@/components/content/faq-accordion'
import { LinkList } from '@/components/content/link-list'
import { PrevNext } from '@/components/content/prev-next'
import { ProgressChecklist } from '@/components/content/progress-checklist'
import { ResourceList } from '@/components/content/resource-list'
import { ShareButtons } from '@/components/content/share-buttons'
import { PageHeader } from '@/components/layout/page-header'
import { renderMdx } from '@/components/mdx/render'
import { JsonLd } from '@/components/seo/json-ld'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { redirectOrNotFound } from '@/lib/data/redirects'
import { getSeoOverrides } from '@/lib/data/seo-overrides'
import { getSiteSettings } from '@/lib/data/settings'
import type { AssignmentSummary } from '@/lib/data/types'
import { getWeekPage, getWeekParams } from '@/lib/data/weeks'
import { formatTerm, parseWeekSegment } from '@/lib/routes'
import { learningResourceJsonLd } from '@/lib/seo/jsonld'
import { buildMetadata } from '@/lib/seo/metadata'
import { weekVars } from '@/lib/seo/vars'
import { PLACEHOLDER_SEGMENT, withPlaceholder } from '@/lib/static-params'
import { formatDateTime } from '@/lib/utils/dates'

export async function generateStaticParams() {
  return withPlaceholder(await getWeekParams(), {
    program: PLACEHOLDER_SEGMENT,
    course: PLACEHOLDER_SEGMENT,
    week: PLACEHOLDER_SEGMENT,
  })
}

async function load(params: PageProps<'/[program]/[course]/[week]'>['params']) {
  const { program, course, week } = await params
  const n = parseWeekSegment(week)
  return n === null ? null : getWeekPage(program, course, n)
}

export async function generateMetadata({
  params,
}: PageProps<'/[program]/[course]/[week]'>): Promise<Metadata> {
  const [data, settings, overrides] = await Promise.all([
    load(params),
    getSiteSettings(),
    getSeoOverrides(),
  ])
  if (!data) return { robots: { index: false } }
  const { core, week } = data
  return buildMetadata({
    settings,
    path: week.path,
    template: 'week',
    vars: weekVars(core, week),
    fallbackTitle: `IITM ${core.course.shortName} Week ${week.number}: ${week.title}`,
    fallbackDescription: week.summary ?? week.title,
    // Thin-page rule: a week with no live notes, assignments or resources is not indexed.
    noindex: !week.hasContent || week.seoNoindex,
    override: overrides[week.path],
  })
}

function AssignmentCard({
  assignment,
  label,
  icon: Icon,
}: {
  assignment: AssignmentSummary
  label: string
  icon: typeof ClipboardCheck
}) {
  return (
    <Link
      href={assignment.path ?? '#'}
      className="group flex h-full flex-col rounded-card border border-border bg-card p-4 hover:border-accent sm:p-5"
    >
      <span className="flex items-center gap-2 text-small font-medium text-accent-ink">
        <Icon aria-hidden="true" className="size-4" /> {label}
      </span>
      <span className="mt-1 font-semibold text-text group-hover:text-accent-ink">
        {assignment.title}
      </span>
      {assignment.summary ? (
        <span className="mt-1 text-small text-muted">{assignment.summary}</span>
      ) : null}
      <span className="mt-auto flex flex-wrap gap-2 pt-3">
        <Badge tone="accent">{formatTerm(assignment.term)}</Badge>
        {assignment.dueAt ? (
          <Badge>
            <CalendarClock aria-hidden="true" className="size-3.5" /> Due{' '}
            {formatDateTime(assignment.dueAt)}
          </Badge>
        ) : null}
        {assignment.type === 'graded' ? (
          <Badge tone={assignment.released ? 'success' : 'warning'}>
            {assignment.released ? 'Solutions released' : 'Hints now, solutions after deadline'}
          </Badge>
        ) : null}
      </span>
    </Link>
  )
}

export default async function WeekPage({ params }: PageProps<'/[program]/[course]/[week]'>) {
  const data = await load(params)
  if (!data) {
    const { program, course, week } = await params
    return redirectOrNotFound(`/${program}/${course}/${week}`)
  }
  const { core, week } = data
  const { course } = core
  const title = `IITM ${course.shortName} Week ${week.number}: ${week.title}`
  const intro = await renderMdx(week.introMdx)

  const progressItems = [
    ...(data.weekNote
      ? [
          {
            id: data.weekNote.id,
            type: 'note' as const,
            label: `Read the week ${week.number} notes`,
          },
        ]
      : []),
    ...(data.graded
      ? [
          {
            id: data.graded.id,
            type: 'assignment' as const,
            label: 'Attempt the graded assignment',
          },
        ]
      : []),
    ...(data.practice
      ? [
          {
            id: data.practice.id,
            type: 'assignment' as const,
            label: 'Finish the practice assignment',
          },
        ]
      : []),
  ]

  return (
    <>
      <PageContext type="week" entityId={week.id} />
      <PageHeader
        crumbs={[
          { name: course.program.shortName, path: course.program.path },
          { name: course.shortName, path: course.path },
          { name: `Week ${week.number}`, path: week.path },
        ]}
        eyebrow={`${course.name} · Week ${week.number}`}
        title={title}
        description={week.summary}
        actions={<BookmarkButton title={title} entityType="week" entityId={week.id} />}
      />

      <div className="container-page py-8 sm:py-10">
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-10">
          <div className="min-w-0 space-y-10">
            {week.topics.length > 0 ? (
              <section aria-labelledby="topics">
                <h2 id="topics" className="text-h3 font-semibold">
                  Topics this week
                </h2>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {week.topics.map((topic) => (
                    <li
                      key={topic}
                      className="rounded-full border border-border bg-surface px-3 py-1 text-small text-text"
                    >
                      {topic}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {intro.content ? (
              <div className="prose-content container-reading">{intro.content}</div>
            ) : null}

            {week.hasContent ? (
              <section aria-labelledby="this-week">
                <h2 id="this-week" className="mb-4 text-h3 font-semibold sm:text-h2">
                  Study this week
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {data.weekNote ? (
                    <Link
                      href={data.weekNote.path}
                      className="group flex flex-col rounded-card border border-border bg-card p-4 hover:border-accent sm:p-5"
                    >
                      <span className="flex items-center gap-2 text-small font-medium text-accent-ink">
                        <BookOpen aria-hidden="true" className="size-4" /> Notes
                      </span>
                      <span className="mt-1 font-semibold text-text group-hover:text-accent-ink">
                        {data.weekNote.title}
                      </span>
                      <span className="mt-1 text-small text-muted">
                        {data.weekNote.readingTimeMinutes} min read
                      </span>
                    </Link>
                  ) : null}
                  {data.graded?.path ? (
                    <AssignmentCard
                      assignment={data.graded}
                      label="Graded assignment"
                      icon={ClipboardCheck}
                    />
                  ) : null}
                  {data.practice?.path ? (
                    <AssignmentCard
                      assignment={data.practice}
                      label="Practice assignment"
                      icon={PenLine}
                    />
                  ) : null}
                </div>
              </section>
            ) : (
              <EmptyState
                icon={<BookOpen className="size-5" />}
                title={`Week ${week.number} study material is on the way`}
                description="Notes and graded assignment help for this week are being written. The topics above are what the week covers."
                action={
                  course.officialUrl ? (
                    <a
                      href={course.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-small font-medium text-accent-ink underline"
                    >
                      Official course page <ExternalLink aria-hidden="true" className="size-3.5" />
                    </a>
                  ) : undefined
                }
              />
            )}

            {data.topicNotes.length > 0 ? (
              <section aria-labelledby="topic-notes">
                <h2 id="topic-notes" className="mb-3 text-h3 font-semibold">
                  Topic notes
                </h2>
                <LinkList
                  items={data.topicNotes.map((n) => ({
                    path: n.path,
                    title: n.title,
                    summary: n.summary,
                  }))}
                  label="Topic notes"
                />
              </section>
            ) : null}

            {data.resources.length > 0 ? (
              <section aria-labelledby="week-resources">
                <h2 id="week-resources" className="mb-3 text-h3 font-semibold">
                  Downloads and links
                </h2>
                <ResourceList items={data.resources} />
              </section>
            ) : null}

            {data.olderTerms.length > 0 ? (
              <section aria-labelledby="older-terms">
                <h2 id="older-terms" className="mb-3 text-h3 font-semibold">
                  Previous terms
                </h2>
                <LinkList
                  items={data.olderTerms.flatMap((a) =>
                    a.path
                      ? [
                          {
                            path: a.path,
                            title: `${a.type === 'graded' ? 'Graded' : 'Practice'} assignment — ${formatTerm(a.term)}`,
                            summary: a.summary,
                          },
                        ]
                      : [],
                  )}
                  label="Previous terms"
                />
              </section>
            ) : null}

            <FaqAccordion faqs={data.faqs} title={`Week ${week.number} FAQs`} />

            <ShareButtons path={week.path} title={title} />

            <PrevNext
              previous={
                data.previous
                  ? {
                      href: data.previous.path,
                      label: 'Previous week',
                      title: `Week ${data.previous.number}: ${data.previous.title}`,
                    }
                  : null
              }
              next={
                data.next
                  ? {
                      href: data.next.path,
                      label: 'Next week',
                      title: `Week ${data.next.number}: ${data.next.title}`,
                    }
                  : null
              }
            />
          </div>

          <aside className="mt-10 space-y-6 lg:mt-0">
            <ProgressChecklist items={progressItems} />
            {data.otherCourses.length > 0 ? (
              <section
                aria-labelledby="other-courses"
                className="rounded-card border border-border bg-card p-4"
              >
                <h2 id="other-courses" className="font-semibold text-text">
                  Other courses this week
                </h2>
                <ul className="mt-2">
                  {data.otherCourses.map((other) => (
                    <li key={other.path}>
                      <Link
                        href={other.path}
                        className="flex min-h-11 items-center text-small font-medium text-accent-ink hover:underline"
                      >
                        {other.shortName} week {week.number}
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`${course.program.path}/week-${week.number}`}
                  className="mt-1 block text-xs text-muted hover:text-text"
                >
                  All {course.program.shortName} courses, week {week.number} →
                </Link>
              </section>
            ) : null}
          </aside>
        </div>
      </div>

      {week.hasContent ? (
        <JsonLd
          data={learningResourceJsonLd({
            name: title,
            description: week.summary ?? title,
            path: week.path,
            resourceType: 'Study guide',
            teaches: week.topics,
            dateModified: week.updatedAt,
            partOf: { name: course.name, path: course.path },
          })}
        />
      ) : null}
    </>
  )
}
