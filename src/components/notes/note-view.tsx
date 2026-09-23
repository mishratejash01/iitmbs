import { Clock, Printer } from 'lucide-react'

import { PageContext } from '@/components/analytics/page-context'
import { QuestionCard } from '@/components/assignment/question-card'
import { ArticleShell } from '@/components/content/article-shell'
import { BookmarkButton } from '@/components/content/bookmark-button'
import { Byline } from '@/components/content/byline'
import { FeedbackWidget } from '@/components/content/feedback-widget'
import { LinkList } from '@/components/content/link-list'
import { PrevNext } from '@/components/content/prev-next'
import { ShareButtons } from '@/components/content/share-buttons'
import { PageHeader } from '@/components/layout/page-header'
import { renderMdx } from '@/components/mdx/render'
import { JsonLd } from '@/components/seo/json-ld'
import { Badge } from '@/components/ui/badge'
import type { NotePageData } from '@/lib/data/notes'
import { formatTerm } from '@/lib/routes'
import { learningResourceJsonLd, type Crumb } from '@/lib/seo/jsonld'

const PAGE_TYPE = { week: 'week_notes', topic: 'notes', formula_sheet: 'formula_sheet', exam_prep: 'exam_prep' } as const
const RESOURCE_TYPE = {
  week: 'Lecture notes',
  topic: 'Lecture notes',
  formula_sheet: 'Formula sheet',
  exam_prep: 'Study guide',
} as const

export async function NoteView({
  data,
  title,
  crumbs,
  previous,
  next,
}: {
  data: NotePageData
  title: string
  crumbs: Crumb[]
  previous?: { href: string; label: string; title?: string } | null
  next?: { href: string; label: string; title?: string } | null
}) {
  const { note, core, week } = data
  const { content, toc } = await renderMdx(note.bodyMdx, { toc: true })

  const related = data.related.map((n) => ({ path: n.path, title: n.title, summary: n.summary }))

  return (
    <>
      <PageContext type={PAGE_TYPE[note.kind]} entityId={note.id} />
      <PageHeader
        crumbs={crumbs}
        eyebrow={`${core.course.name}${core.course.code ? ` · ${core.course.code}` : ''}`}
        title={title}
        description={note.summary}
        meta={
          <>
            {note.readingTimeMinutes ? (
              <Badge>
                <Clock aria-hidden="true" className="size-3.5" />
                {note.readingTimeMinutes} min read
              </Badge>
            ) : null}
            {week ? <Badge tone="accent">Week {week.number}</Badge> : null}
          </>
        }
        actions={
          <>
            <BookmarkButton title={title} entityType="note" entityId={note.id} />
            {note.kind === 'formula_sheet' ? (
              <a
                href="#print"
                className="inline-flex min-h-11 items-center gap-2 rounded-control border border-border px-3 text-small font-medium text-text hover:border-accent"
                data-print-button=""
              >
                <Printer aria-hidden="true" className="size-4" />
                Print
              </a>
            ) : null}
          </>
        }
      />

      <ArticleShell toc={toc}>
        <Byline author={data.author} reviewer={data.reviewer} reviewedAt={note.reviewedAt} updatedAt={note.updatedAt} />
        {content ? <div className="prose-content mt-6">{content}</div> : null}

        {data.practiceSets.length > 0 ? (
          <section aria-labelledby="practice-sets" className="mt-12 space-y-8">
            <h2 id="practice-sets" className="text-h3 font-semibold sm:text-h2">
              Practice sets
            </h2>
            {await Promise.all(
              data.practiceSets.map(async (set) => {
                const intro = await renderMdx(set.introMdx, { headingOffset: 2 })
                return (
                  <section key={set.id} aria-label={set.title} className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-text">{set.title}</h3>
                      <p className="text-small text-muted">{formatTerm(set.term)} term</p>
                    </div>
                    {intro.content ? <div className="prose-content">{intro.content}</div> : null}
                    {set.questions.map((question) => (
                      <QuestionCard key={question.id} question={question} />
                    ))}
                  </section>
                )
              }),
            )}
          </section>
        ) : null}

        {related.length > 0 ? (
          <section aria-labelledby="keep-reading" className="mt-12">
            <h2 id="keep-reading" className="mb-3 text-h3 font-semibold">
              Keep reading
            </h2>
            <LinkList items={related} label="Related notes" />
          </section>
        ) : null}

        <div className="mt-10 space-y-6 border-t border-border pt-6">
          <FeedbackWidget pageType={PAGE_TYPE[note.kind]} entityId={note.id} />
          <ShareButtons path={note.path} title={title} />
        </div>

        <PrevNext previous={previous ?? null} next={next ?? null} />
      </ArticleShell>

      <JsonLd
        data={learningResourceJsonLd({
          name: title,
          description: note.summary ?? title,
          path: note.path,
          resourceType: RESOURCE_TYPE[note.kind],
          teaches: week?.topics ?? [],
          minutes: note.readingTimeMinutes,
          author: data.author,
          reviewer: data.reviewer,
          datePublished: note.publishedAt,
          dateModified: note.updatedAt,
          partOf: { name: core.course.name, path: core.course.path },
        })}
      />
    </>
  )
}
