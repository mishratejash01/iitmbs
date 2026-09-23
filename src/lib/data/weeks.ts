import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'

import { tableTag } from '@/lib/cache/tags'
import { getPublicClient } from '@/lib/supabase/public'

import { getCourseCore, getCourseParams, type CourseCore } from './courses'
import { toFaq } from './mappers'
import { getProgramPage } from './programs'
import { contentCacheProfile } from './settings'
import type { AssignmentSummary, Faq, NoteSummary, ResourceItem, WeekSummary } from './types'

export type WeekPageData = {
  core: CourseCore
  week: WeekSummary & { introMdx: string | null; updatedAt: string; seoNoindex: boolean }
  weekNote: NoteSummary | null
  topicNotes: NoteSummary[]
  graded: AssignmentSummary | null
  practice: AssignmentSummary | null
  olderTerms: AssignmentSummary[]
  resources: ResourceItem[]
  faqs: Faq[]
  previous: WeekSummary | null
  next: WeekSummary | null
  /** The same week in the programme's other courses. */
  otherCourses: Array<{ shortName: string; name: string; path: string }>
}

export async function getWeekPage(
  programSlug: string,
  courseSlug: string,
  weekNumber: number,
): Promise<WeekPageData | null> {
  'use cache'
  cacheLife(await contentCacheProfile())
  cacheTag(
    tableTag('programs'),
    tableTag('courses'),
    tableTag('weeks'),
    tableTag('notes'),
    tableTag('assignments'),
    tableTag('resources'),
    tableTag('faqs'),
  )

  const core = await getCourseCore(programSlug, courseSlug)
  if (!core) return null
  const index = core.weeks.findIndex((w) => w.number === weekNumber)
  const summary = core.weeks[index]
  if (!summary) return null

  const db = getPublicClient()
  const [weekRes, faqRes] = await Promise.all([
    db.from('weeks').select('intro_mdx, updated_at, noindex').eq('id', summary.id).maybeSingle(),
    db
      .from('faqs')
      .select('id, question, answer_mdx')
      .eq('scope', 'week')
      .eq('scope_id', summary.id)
      .order('sort_order'),
  ])
  if (weekRes.error) console.error('[data/weeks] week failed:', weekRes.error.message)
  if (faqRes.error) console.error('[data/weeks] faqs failed:', faqRes.error.message)

  const inWeek = core.assignments.filter((a) => a.weekNumber === weekNumber)
  const otherCourses = await Promise.all(
    core.siblings.map(async (sibling) => {
      const siblingCore = await getCourseCore(programSlug, sibling.slug)
      const week = siblingCore?.weeks.find((w) => w.number === weekNumber)
      return week ? { shortName: sibling.shortName, name: sibling.name, path: week.path } : null
    }),
  )

  return {
    core,
    week: {
      ...summary,
      introMdx: weekRes.data?.intro_mdx ?? null,
      updatedAt: weekRes.data?.updated_at ?? core.course.updatedAt,
      seoNoindex: weekRes.data?.noindex ?? false,
    },
    weekNote: core.notes.find((n) => n.kind === 'week' && n.weekNumber === weekNumber) ?? null,
    topicNotes: core.notes.filter((n) => n.kind === 'topic' && n.weekNumber === weekNumber),
    graded: inWeek.find((a) => a.type === 'graded' && a.isLatest) ?? null,
    practice: inWeek.find((a) => a.type === 'practice' && a.isLatest) ?? null,
    olderTerms: inWeek.filter((a) => !a.isLatest && a.type !== 'activity'),
    resources: core.resources.filter((r) => r.weekId === summary.id),
    faqs: (faqRes.data ?? []).map(toFaq),
    previous: core.weeks[index - 1] ?? null,
    next: core.weeks[index + 1] ?? null,
    otherCourses: otherCourses.filter((c): c is NonNullable<typeof c> => c !== null),
  }
}

export type ProgramWeekData = {
  programSlug: string
  programName: string
  programShortName: string
  weekNumber: number
  hasContent: boolean
  weeks: number[]
  courses: Array<{
    name: string
    shortName: string
    code: string | null
    coursePath: string
    week: WeekSummary | null
    graded: AssignmentSummary | null
    practice: AssignmentSummary | null
    weekNote: NoteSummary | null
  }>
}

/** Cross-course week hub: every course's week-n in one place. */
export async function getProgramWeek(programSlug: string, weekNumber: number): Promise<ProgramWeekData | null> {
  'use cache'
  cacheLife(await contentCacheProfile())
  cacheTag(
    tableTag('programs'),
    tableTag('courses'),
    tableTag('course_programs'),
    tableTag('weeks'),
    tableTag('notes'),
    tableTag('assignments'),
  )

  const page = await getProgramPage(programSlug)
  if (!page || !page.weeks.some((w) => w.number === weekNumber)) return null

  const courses = await Promise.all(
    page.courses
      .filter((course) => course.homeProgram === null)
      .map(async (course) => {
        const core = await getCourseCore(programSlug, course.slug)
        const week = core?.weeks.find((w) => w.number === weekNumber) ?? null
        const inWeek = core?.assignments.filter((a) => a.weekNumber === weekNumber && a.isLatest) ?? []
        return {
          name: course.name,
          shortName: course.shortName,
          code: course.code,
          coursePath: course.path,
          week,
          graded: inWeek.find((a) => a.type === 'graded') ?? null,
          practice: inWeek.find((a) => a.type === 'practice') ?? null,
          weekNote: core?.notes.find((n) => n.kind === 'week' && n.weekNumber === weekNumber) ?? null,
        }
      }),
  )

  return {
    programSlug: page.program.slug,
    programName: page.program.name,
    programShortName: page.program.shortName,
    weekNumber,
    hasContent: courses.some((c) => c.week?.hasContent),
    weeks: page.weeks.map((w) => w.number),
    courses,
  }
}

/** Every live (programme, course, week) triple — for generateStaticParams. */
export async function getWeekParams(): Promise<Array<{ program: string; course: string; week: string }>> {
  'use cache'
  cacheLife(await contentCacheProfile())
  cacheTag(tableTag('programs'), tableTag('courses'), tableTag('weeks'))

  const params = await getCourseParams()
  const results = await Promise.all(
    params.map(async ({ program, course }) => {
      const core = await getCourseCore(program, course)
      return (core?.weeks ?? []).map((w) => ({ program, course, week: `week-${w.number}` }))
    }),
  )
  return results.flat()
}
