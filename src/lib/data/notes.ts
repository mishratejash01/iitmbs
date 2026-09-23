import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'

import { tableTag } from '@/lib/cache/tags'
import { getPublicClient } from '@/lib/supabase/public'

import { getAssignmentSets, type PracticeSet } from './practice-sets'
import { getAuthorsByIds } from './authors'
import { getCourseCore, getCourseParams, type CourseCore } from './courses'
import { SEO_COLUMNS, toSeo } from './mappers'
import { contentCacheProfile } from './settings'
import type { AuthorRef, NoteKind, NoteSummary, SeoFields, WeekSummary } from './types'

export type NoteDetail = NoteSummary & {
  bodyMdx: string
  wordCount: number
  version: number
  reviewedAt: string | null
  publishedAt: string | null
  sourcePermission: 'original' | 'permission_granted' | 'official_link'
  sourceUrl: string | null
  seo: SeoFields
}

export type NotePageData = {
  core: CourseCore
  note: NoteDetail
  week: WeekSummary | null
  author: AuthorRef | null
  reviewer: AuthorRef | null
  /** Other notes of the course, for "keep reading" links. */
  related: NoteSummary[]
  /** Course-level practice sets (exam-prep page only). */
  practiceSets: PracticeSet[]
}

async function loadNote(core: CourseCore, summary: NoteSummary): Promise<NotePageData | null> {
  const { data, error } = await getPublicClient()
    .from('notes')
    .select(
      `body_mdx, word_count, version, reviewed_at, published_at, author_id, reviewer_id, source_permission, source_url, ${SEO_COLUMNS}`,
    )
    .eq('id', summary.id)
    .maybeSingle()

  if (error) console.error('[data/notes] note failed:', error.message)
  if (!data) return null

  const authors = await getAuthorsByIds(
    [data.author_id, data.reviewer_id].filter((id): id is string => Boolean(id)),
  )
  const practiceSets =
    summary.kind === 'exam_prep'
      ? await getAssignmentSets(
          core.assignments.filter((a) => a.weekNumber === null && a.type === 'practice').map((a) => a.id),
        )
      : []

  return {
    core,
    note: {
      ...summary,
      bodyMdx: data.body_mdx,
      wordCount: data.word_count,
      version: data.version,
      reviewedAt: data.reviewed_at,
      publishedAt: data.published_at,
      sourcePermission: data.source_permission,
      sourceUrl: data.source_url,
      seo: toSeo(data),
    },
    week: summary.weekNumber ? (core.weeks.find((w) => w.number === summary.weekNumber) ?? null) : null,
    author: data.author_id ? (authors[data.author_id] ?? null) : null,
    reviewer: data.reviewer_id ? (authors[data.reviewer_id] ?? null) : null,
    related: core.notes.filter((n) => n.id !== summary.id && n.kind !== 'exam_prep').slice(0, 8),
    practiceSets,
  }
}

const NOTE_TAGS = [
  tableTag('programs'),
  tableTag('courses'),
  tableTag('weeks'),
  tableTag('notes'),
  tableTag('assignments'),
  tableTag('questions'),
  tableTag('authors'),
]

/** A topic note: /<programme>/<course>/notes/<slug>. */
export async function getTopicNotePage(
  programSlug: string,
  courseSlug: string,
  slug: string,
): Promise<NotePageData | null> {
  'use cache'
  cacheLife(await contentCacheProfile())
  cacheTag(...NOTE_TAGS)

  const core = await getCourseCore(programSlug, courseSlug)
  const summary = core?.notes.find((n) => n.kind === 'topic' && n.slug === slug)
  return core && summary ? loadNote(core, summary) : null
}

/** The week's notes: /<programme>/<course>/week-<n>/notes. */
export async function getWeekNotePage(
  programSlug: string,
  courseSlug: string,
  weekNumber: number,
): Promise<NotePageData | null> {
  'use cache'
  cacheLife(await contentCacheProfile())
  cacheTag(...NOTE_TAGS)

  const core = await getCourseCore(programSlug, courseSlug)
  const summary = core?.notes.find((n) => n.kind === 'week' && n.weekNumber === weekNumber)
  return core && summary ? loadNote(core, summary) : null
}

/** Formula sheet or exam-prep page of a course. */
export async function getCourseNotePage(
  programSlug: string,
  courseSlug: string,
  kind: Extract<NoteKind, 'formula_sheet' | 'exam_prep'>,
): Promise<NotePageData | null> {
  'use cache'
  cacheLife(await contentCacheProfile())
  cacheTag(...NOTE_TAGS)

  const core = await getCourseCore(programSlug, courseSlug)
  if (!core) return null
  const summary = core.notes.find((n) => n.kind === kind)
  if (summary) return loadNote(core, summary)

  // An exam-prep page may consist only of practice sets.
  const sets = core.assignments.filter((a) => a.weekNumber === null && a.type === 'practice')
  if (kind === 'exam_prep' && sets.length > 0) {
    return {
      core,
      note: {
        id: core.course.id,
        slug: 'qualifier-exam-prep',
        kind: 'exam_prep',
        title: `${core.course.name} Qualifier Exam Preparation`,
        summary: null,
        readingTimeMinutes: 1,
        weekNumber: null,
        path: `${core.course.path}/qualifier-exam-prep`,
        updatedAt: sets.reduce((max, s) => (s.updatedAt > max ? s.updatedAt : max), sets[0]!.updatedAt),
        bodyMdx: '',
        wordCount: 0,
        version: 1,
        reviewedAt: null,
        publishedAt: null,
        sourcePermission: 'original',
        sourceUrl: null,
        seo: toSeo({
          seo_title: null,
          seo_description: null,
          og_image_public_id: null,
          canonical_path: null,
          noindex: false,
          keywords: [],
          schema_overrides: {},
        }),
      },
      week: null,
      author: null,
      reviewer: null,
      related: core.notes.filter((n) => n.kind !== 'exam_prep').slice(0, 8),
      practiceSets: await getAssignmentSets(sets.map((s) => s.id)),
    }
  }
  return null
}

/** Every live topic note URL — for generateStaticParams. */
export async function getTopicNoteParams(): Promise<Array<{ program: string; course: string; slug: string }>> {
  'use cache'
  cacheLife(await contentCacheProfile())
  cacheTag(tableTag('programs'), tableTag('courses'), tableTag('notes'))

  const courses = await getCourseParams()
  const results = await Promise.all(
    courses.map(async ({ program, course }) => {
      const core = await getCourseCore(program, course)
      return (core?.notes ?? [])
        .filter((n) => n.kind === 'topic')
        .map((n) => ({ program, course, slug: n.slug }))
    }),
  )
  return results.flat()
}
