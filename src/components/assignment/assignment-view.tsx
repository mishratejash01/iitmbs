import { BookOpen, CalendarClock, Clock, FileText, ListChecks } from 'lucide-react'
import Link from 'next/link'

import { PageContext } from '@/components/analytics/page-context'
import { BookmarkButton } from '@/components/content/bookmark-button'
import { Byline } from '@/components/content/byline'
import { FaqAccordion } from '@/components/content/faq-accordion'
import { FeedbackWidget } from '@/components/content/feedback-widget'
import { LinkList } from '@/components/content/link-list'
import { PrevNext } from '@/components/content/prev-next'
import { ShareButtons } from '@/components/content/share-buttons'
import { PageHeader } from '@/components/layout/page-header'
import { renderMdx } from '@/components/mdx/render'
import { JsonLd } from '@/components/seo/json-ld'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import type { AssignmentPageData } from '@/lib/data/assignments'
import { assignmentPath, formatTerm, weekNotesPath } from '@/lib/routes'
import { learningResourceJsonLd, quizJsonLd } from '@/lib/seo/jsonld'
import { formatDateTime } from '@/lib/utils/dates'

import { QuestionCard } from './question-card'
import { SolutionGate } from './solution-gate'

const KIND_LABEL = {
  graded: 'Graded Assignment',
  practice: 'Practice Assignment',
  activity: 'Activity',
} as const

export async function AssignmentView({ data }: { data: AssignmentPageData }) {
  const { core, week, assignment, questions, released } = data
  const { course } = core
  const kindLabel = KIND_LABEL[assignment.type]
  const title = `IITM ${course.shortName} Week ${week.number} ${kindLabel}`
  const path = assignment.path ?? week.path

  const [intro, mistakes] = await Promise.all([
    renderMdx(assignment.introMdx, { headingOffset: 1 }),
    renderMdx(assignment.commonMistakesMdx, { headingOffset: 1 }),
  ])

  const previousWeek = core.weeks.find((w) => w.number === week.number - 1)
  const nextWeek = core.weeks.find((w) => w.number === week.number + 1)
  const kind = assignment.type === 'practice' ? 'practice' : 'graded'
  const neighbour = (w: typeof week | undefined, label: string) =>
    w && (kind === 'graded' ? w.hasGraded : w.hasPractice)
      ? {
          href: assignmentPath(course.program.slug, course.slug, w.number, kind),
          label,
          title: `Week ${w.number}: ${w.title}`,
        }
      : null

  const related = [
    ...(data.weekNote ? [{ path: data.weekNote.path, title: data.weekNote.title }] : []),
    ...data.topicNotes.map((n) => ({ path: n.path, title: n.title })),
    ...(data.companion?.path
      ? [
          {
            path: data.companion.path,
            title: `Week ${week.number} ${KIND_LABEL[data.companion.type]}`,
          },
        ]
      : []),
    ...core.notes
      .filter((n) => n.kind === 'formula_sheet')
      .map((n) => ({
        path: n.path,
        title: `${course.shortName} formula sheet`,
      })),
    {
      path: week.path,
      title: `Everything for ${course.shortName} week ${week.number}`,
    },
  ]

  return (
    <>
      <PageContext
        type={assignment.type === 'graded' ? 'graded_assignment' : 'practice_assignment'}
        entityId={assignment.id}
      />
      <PageHeader
        crumbs={[
          { name: course.program.shortName, path: course.program.path },
          { name: course.shortName, path: course.path },
          { name: `Week ${week.number}`, path: week.path },
          { name: kindLabel, path },
        ]}
        title={title}
        meta={
          <>
            <Badge tone="accent">{formatTerm(assignment.term)} term</Badge>
            {assignment.dueAt ? (
              <Badge>
                <CalendarClock aria-hidden="true" className="size-3.5" />
                Due {formatDateTime(assignment.dueAt)}
              </Badge>
            ) : null}
            <Badge tone={released ? 'success' : 'warning'}>
              {released ? 'Walkthroughs released' : 'Hints only until the deadline'}
            </Badge>
            {questions.length > 0 ? (
              <Badge>
                <ListChecks aria-hidden="true" className="size-3.5" />
                {questions.length} questions
              </Badge>
            ) : null}
            {assignment.estimatedMinutes ? (
              <Badge>
                <Clock aria-hidden="true" className="size-3.5" />~{assignment.estimatedMinutes} min
              </Badge>
            ) : null}
          </>
        }
        actions={<BookmarkButton title={title} entityType="assignment" entityId={assignment.id} />}
      />

      <div className="container-page py-8 sm:py-10">
        <div className="container-reading space-y-8">
          {!released ? (
            <SolutionGate assignmentId={assignment.id} releaseAt={assignment.solutionsReleaseAt} />
          ) : null}

          {intro.content ? (
            <section aria-labelledby="overview">
              <h2 id="overview" className="text-h3 font-semibold sm:text-h2">
                What this assignment covers
              </h2>
              <div className="prose-content mt-3">{intro.content}</div>
            </section>
          ) : null}

          {assignment.concepts.length > 0 ? (
            <section aria-labelledby="concepts">
              <h2 id="concepts" className="text-h3 font-semibold">
                Concepts tested
              </h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {assignment.concepts.map((concept) => (
                  <li key={concept}>
                    <Badge tone="accent" className="text-small">
                      {concept}
                    </Badge>
                  </li>
                ))}
              </ul>
              {data.weekNote ? (
                <p className="mt-3 text-small text-muted">
                  Revise them in the{' '}
                  <Link
                    href={weekNotesPath(course.program.slug, course.slug, week.number)}
                    className="font-medium text-accent-ink underline"
                  >
                    week {week.number} notes
                  </Link>
                  .
                </p>
              ) : null}
            </section>
          ) : null}

          <section aria-labelledby="questions">
            <h2 id="questions" className="text-h3 font-semibold sm:text-h2">
              {released ? 'Questions and worked solutions' : 'Questions and hints'}
            </h2>
            {questions.length > 0 ? (
              <div className="mt-4 space-y-4">
                {questions.map((question) => (
                  <QuestionCard key={question.id} question={question} />
                ))}
              </div>
            ) : (
              <EmptyState
                className="mt-4"
                icon={<FileText className="size-5" />}
                title="Questions are being added"
                description="Check back soon — meanwhile the notes for this week cover every concept tested."
              />
            )}
          </section>

          {mistakes.content ? (
            <section aria-labelledby="mistakes">
              <h2 id="mistakes" className="text-h3 font-semibold">
                Common mistakes
              </h2>
              <div className="prose-content mt-3">{mistakes.content}</div>
            </section>
          ) : null}

          {related.length > 0 ? (
            <section aria-labelledby="related">
              <h2 id="related" className="mb-3 flex items-center gap-2 text-h3 font-semibold">
                <BookOpen aria-hidden="true" className="size-5 text-accent-ink" /> Study with
              </h2>
              <LinkList items={related} label="Related study material" />
            </section>
          ) : null}

          {data.otherTerms.length > 0 ? (
            <section aria-labelledby="other-terms">
              <h2 id="other-terms" className="mb-3 text-h3 font-semibold">
                Other terms
              </h2>
              <LinkList
                items={data.otherTerms.flatMap((a) =>
                  a.path
                    ? [
                        {
                          path: a.path,
                          title: `${kindLabel} — ${formatTerm(a.term)}`,
                        },
                      ]
                    : [],
                )}
                label="Other terms"
              />
            </section>
          ) : null}

          <FaqAccordion faqs={data.faqs} />

          <div className="space-y-6 border-t border-border pt-6">
            <Byline
              author={data.author}
              reviewer={data.reviewer}
              updatedAt={assignment.updatedAt}
            />
            <FeedbackWidget
              pageType={assignment.type === 'graded' ? 'graded_assignment' : 'practice_assignment'}
              entityId={assignment.id}
            />
            <ShareButtons path={path} title={title} />
          </div>

          <PrevNext
            previous={neighbour(previousWeek, 'Previous week')}
            next={neighbour(nextWeek, 'Next week')}
          />
        </div>
      </div>

      <JsonLd
        data={[
          learningResourceJsonLd({
            name: title,
            description:
              assignment.summary ??
              `${kindLabel} for ${course.name}, week ${week.number}: ${week.title}.`,
            path,
            resourceType: assignment.type === 'graded' ? 'Assignment' : 'Practice problems',
            teaches: assignment.concepts.length > 0 ? assignment.concepts : week.topics,
            minutes: assignment.estimatedMinutes,
            author: data.author,
            reviewer: data.reviewer,
            datePublished: assignment.publishedAt,
            dateModified: assignment.updatedAt,
            partOf: { name: course.name, path: course.path },
          }),
          released
            ? quizJsonLd({ name: title, path, topics: assignment.concepts, questions })
            : null,
        ]}
      />
    </>
  )
}
