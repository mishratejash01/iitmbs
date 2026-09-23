import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'

import { tableTag } from '@/lib/cache/tags'
import type { AssignmentKind } from '@/lib/routes'
import { getPublicClient } from '@/lib/supabase/public'

import { getAuthorsByIds } from './authors'
import { getCourseCore, getCourseParams, type CourseCore } from './courses'
import { SEO_COLUMNS, toFaq, toSeo } from './mappers'
import { toQuestion } from './questions'
import { contentCacheProfile } from './settings'
import type {
  AssignmentSummary,
  AuthorRef,
  Faq,
  NoteSummary,
  Question,
  SeoFields,
  WeekSummary,
} from './types'

export type AssignmentDetail = AssignmentSummary & {
  introMdx: string | null
  concepts: string[]
  commonMistakesMdx: string | null
  estimatedMinutes: number | null
  sourcePermission: 'original' | 'permission_granted' | 'official_link'
  sourceUrl: string | null
  publishedAt: string | null
  seo: SeoFields
}

export type AssignmentPageData = {
  core: CourseCore
  week: WeekSummary
  assignment: AssignmentDetail
  /** Whether walkthroughs were released when this page was generated. */
  released: boolean
  questions: Question[]
  author: AuthorRef | null
  reviewer: AuthorRef | null
  otherTerms: AssignmentSummary[]
  /** The companion assignment of the other kind in the same week. */
  companion: AssignmentSummary | null
  weekNote: NoteSummary | null
  topicNotes: NoteSummary[]
  faqs: Faq[]
}

export async function getAssignmentPage(
  programSlug: string,
  courseSlug: string,
  weekNumber: number,
  kind: AssignmentKind,
  term: string | null,
): Promise<AssignmentPageData | null> {
  'use cache'
  cacheTag(
    tableTag('programs'),
    tableTag('courses'),
    tableTag('weeks'),
    tableTag('assignments'),
    tableTag('questions'),
    tableTag('notes'),
    tableTag('faqs'),
    tableTag('authors'),
  )
  const profile = await contentCacheProfile()

  const core = await getCourseCore(programSlug, courseSlug)
  const week = core?.weeks.find((w) => w.number === weekNumber)
  const summary = core?.assignments.find(
    (a) => a.weekNumber === weekNumber && a.type === kind && (term ? a.term === term : a.isLatest),
  )
  if (!core || !week || !summary) {
    cacheLife(profile)
    return null
  }

  const db = getPublicClient()
  const [detailRes, questionsRes, faqRes] = await Promise.all([
    db
      .from('assignments')
      .select(
        `intro_mdx, concepts, common_mistakes_mdx, estimated_minutes, author_id, reviewer_id, source_permission, source_url, published_at, ${SEO_COLUMNS}`,
      )
      .eq('id', summary.id)
      .maybeSingle(),
    db.rpc('get_assignment_questions', { p_assignment_id: summary.id }),
    db
      .from('faqs')
      .select('id, question, answer_mdx, scope')
      .or(`and(scope.eq.assignment,scope_id.eq.${summary.id}),and(scope.eq.week,scope_id.eq.${week.id})`)
      .order('sort_order'),
  ])
  for (const result of [detailRes, questionsRes, faqRes]) {
    if (result.error) console.error('[data/assignments] query failed:', result.error.message)
  }

  const detail = detailRes.data
  if (!detail) {
    cacheLife(profile)
    return null
  }

  // Never keep a pre-release render cached past the release moment: the
  // page's lifetime is capped at the seconds remaining until walkthroughs
  // unlock (pg_cron also pings /api/revalidate at that moment).
  const secondsUntilRelease = Math.ceil((Date.parse(summary.solutionsReleaseAt) - Date.now()) / 1000)
  const released = secondsUntilRelease <= 0
  if (released) {
    cacheLife(profile)
  } else {
    const revalidate = Math.max(60, Math.min(profile.revalidate, secondsUntilRelease))
    cacheLife({ stale: Math.min(profile.stale, revalidate), revalidate, expire: profile.expire })
  }

  const authors = await getAuthorsByIds(
    [detail.author_id, detail.reviewer_id].filter((id): id is string => Boolean(id)),
  )

  const questions: Question[] = (questionsRes.data ?? []).map(toQuestion)

  const inWeek = core.assignments.filter((a) => a.weekNumber === weekNumber)
  const companionKind = kind === 'graded' ? 'practice' : 'graded'

  return {
    core,
    week,
    assignment: {
      ...summary,
      introMdx: detail.intro_mdx,
      concepts: detail.concepts,
      commonMistakesMdx: detail.common_mistakes_mdx,
      estimatedMinutes: detail.estimated_minutes,
      sourcePermission: detail.source_permission,
      sourceUrl: detail.source_url,
      publishedAt: detail.published_at,
      seo: toSeo(detail),
    },
    released,
    questions,
    author: detail.author_id ? (authors[detail.author_id] ?? null) : null,
    reviewer: detail.reviewer_id ? (authors[detail.reviewer_id] ?? null) : null,
    otherTerms: inWeek.filter((a) => a.type === kind && a.id !== summary.id),
    companion: inWeek.find((a) => a.type === companionKind && a.isLatest) ?? null,
    weekNote: core.notes.find((n) => n.kind === 'week' && n.weekNumber === weekNumber) ?? null,
    topicNotes: core.notes.filter((n) => n.kind === 'topic' && n.weekNumber === weekNumber),
    faqs: (faqRes.data ?? [])
      .sort((a, b) => (a.scope === 'assignment' ? -1 : 0) - (b.scope === 'assignment' ? -1 : 0))
      .map(toFaq),
  }
}

/** Every live assignment URL — for generateStaticParams. */
export async function getAssignmentParams(
  kind: AssignmentKind,
): Promise<Array<{ program: string; course: string; week: string; term?: string }>> {
  'use cache'
  cacheLife(await contentCacheProfile())
  cacheTag(tableTag('programs'), tableTag('courses'), tableTag('weeks'), tableTag('assignments'))

  const courses = await getCourseParams()
  const results = await Promise.all(
    courses.map(async ({ program, course }) => {
      const core = await getCourseCore(program, course)
      return (core?.assignments ?? [])
        .filter((a) => a.type === kind && a.weekNumber !== null)
        .map((a) => ({
          program,
          course,
          week: `week-${a.weekNumber}`,
          ...(a.isLatest ? {} : { term: a.term }),
        }))
    }),
  )
  return results.flat()
}
