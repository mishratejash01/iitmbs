import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'

import { tableTag } from '@/lib/cache/tags'
import {
  assignmentPath,
  coursePath,
  examPrepPath,
  formulaSheetPath,
  notePath,
  termSortKey,
  weekNotesPath,
  weekPath,
} from '@/lib/routes'
import { getPublicClient } from '@/lib/supabase/public'

import { RESOURCE_COLUMNS, SEO_COLUMNS, toFaq, toResource, toSeo } from './mappers'
import { getProgramBySlug, getPrograms } from './programs'
import { contentCacheProfile } from './settings'
import type {
  AssignmentSummary,
  CourseRef,
  Faq,
  NoteSummary,
  ProgramRef,
  ResourceItem,
  SeoFields,
  WeekSummary,
} from './types'

export type CourseDetail = CourseRef & {
  description: string | null
  introMdx: string | null
  officialUrl: string | null
  credits: number | null
  weeksCount: number
  updatedAt: string
  seo: SeoFields
  /** Other programmes whose qualifier includes this course. */
  alsoIn: ProgramRef[]
}

export type CourseCore = {
  course: CourseDetail
  weeks: WeekSummary[]
  notes: NoteSummary[]
  assignments: AssignmentSummary[]
  resources: Array<ResourceItem & { weekId: string | null }>
  /** Other live courses of the same programme, for cross-links. */
  siblings: Array<{ id: string; slug: string; name: string; shortName: string; path: string }>
}

export type CoursePageData = CourseCore & { faqs: Faq[] }

const CORE_TAGS = [
  tableTag('programs'),
  tableTag('courses'),
  tableTag('course_programs'),
  tableTag('weeks'),
  tableTag('notes'),
  tableTag('assignments'),
  tableTag('resources'),
]

/** Everything about a course that its hub, week, notes and assignment pages share. */
export async function getCourseCore(
  programSlug: string,
  courseSlug: string,
): Promise<CourseCore | null> {
  'use cache'
  cacheTag(...CORE_TAGS)
  const profile = await contentCacheProfile()

  const program = await getProgramBySlug(programSlug)
  if (!program) {
    cacheLife(profile)
    return null
  }
  const db = getPublicClient()

  const { data: course, error } = await db
    .from('courses')
    .select(
      `id, slug, name, short_name, code, aliases, description, intro_mdx, official_url, credits, weeks_count, updated_at, ${SEO_COLUMNS}`,
    )
    .eq('program_id', program.id)
    .eq('slug', courseSlug)
    .maybeSingle()

  if (error) console.error('[data/courses] lookup failed:', error.message)
  if (!course) {
    cacheLife(profile)
    return null
  }

  const [weeksRes, notesRes, assignmentsRes, resourcesRes, siblingsRes, crossRes, programs] =
    await Promise.all([
      db
        .from('weeks')
        .select('id, week_number, title, summary, topics')
        .eq('course_id', course.id)
        .order('week_number'),
      db
        .from('notes')
        .select(
          'id, slug, kind, title, summary, week_id, reading_time_minutes, updated_at, sort_order',
        )
        .eq('course_id', course.id)
        .order('sort_order'),
      db
        .from('assignments')
        .select('id, week_id, type, term, title, summary, due_at, solutions_release_at, updated_at')
        .eq('course_id', course.id),
      db.from('resources').select(RESOURCE_COLUMNS).eq('course_id', course.id).order('sort_order'),
      db
        .from('courses')
        .select('id, slug, name, short_name')
        .eq('program_id', program.id)
        .neq('id', course.id)
        .order('sort_order'),
      db.from('course_programs').select('program_id').eq('course_id', course.id),
      getPrograms(),
    ])

  for (const result of [weeksRes, notesRes, assignmentsRes, resourcesRes, siblingsRes, crossRes]) {
    if (result.error) console.error('[data/courses] core query failed:', result.error.message)
  }

  const weekRows = weeksRes.data ?? []
  const weekNumberById = new Map(weekRows.map((w) => [w.id, w.week_number]))

  // Latest live term per (week, type) is served at the base URL.
  const latestTerm = new Map<string, string>()
  for (const a of assignmentsRes.data ?? []) {
    if (!a.week_id || a.type === 'activity') continue
    const key = `${a.week_id}:${a.type}`
    const current = latestTerm.get(key)
    if (!current || termSortKey(a.term) > termSortKey(current)) latestTerm.set(key, a.term)
  }

  const assignments: AssignmentSummary[] = (assignmentsRes.data ?? []).flatMap((a) => {
    const weekNumber = a.week_id ? weekNumberById.get(a.week_id) : null
    // Week-level items whose week is not live are unreachable.
    if (a.week_id && weekNumber === undefined) return []
    const isLatest = !a.week_id || latestTerm.get(`${a.week_id}:${a.type}`) === a.term
    let path: string | null = null
    if (weekNumber && a.type !== 'activity') {
      path = assignmentPath(program.slug, course.slug, weekNumber, a.type, isLatest ? null : a.term)
    } else if (!a.week_id && a.type === 'practice') {
      path = examPrepPath(program.slug, course.slug)
    }
    return [
      {
        id: a.id,
        type: a.type,
        term: a.term,
        title: a.title,
        summary: a.summary,
        dueAt: a.due_at,
        solutionsReleaseAt: a.solutions_release_at,
        released: Date.parse(a.solutions_release_at) <= Date.now(),
        weekNumber: weekNumber ?? null,
        isLatest,
        path,
        updatedAt: a.updated_at,
      },
    ]
  })
  assignments.sort(
    (x, y) =>
      (x.weekNumber ?? 99) - (y.weekNumber ?? 99) ||
      x.type.localeCompare(y.type) ||
      termSortKey(y.term) - termSortKey(x.term),
  )

  const notes: NoteSummary[] = (notesRes.data ?? []).flatMap((n) => {
    const weekNumber = n.week_id ? (weekNumberById.get(n.week_id) ?? null) : null
    let path: string
    switch (n.kind) {
      case 'week':
        if (weekNumber === null) return []
        path = weekNotesPath(program.slug, course.slug, weekNumber)
        break
      case 'formula_sheet':
        path = formulaSheetPath(program.slug, course.slug)
        break
      case 'exam_prep':
        path = examPrepPath(program.slug, course.slug)
        break
      default:
        path = notePath(program.slug, course.slug, n.slug)
    }
    return [
      {
        id: n.id,
        slug: n.slug,
        kind: n.kind,
        title: n.title,
        summary: n.summary,
        readingTimeMinutes: n.reading_time_minutes,
        weekNumber,
        path,
        updatedAt: n.updated_at,
      },
    ]
  })

  const resources = (resourcesRes.data ?? []).map((r) => ({ ...toResource(r), weekId: r.week_id }))

  // Keep "solutions released" flags honest: never cache past the next release.
  const nextRelease = Math.min(
    ...assignments
      .map((a) => (Date.parse(a.solutionsReleaseAt) - Date.now()) / 1000)
      .filter((seconds) => seconds > 0),
  )
  if (Number.isFinite(nextRelease) && nextRelease < profile.revalidate) {
    const revalidate = Math.max(60, Math.ceil(nextRelease))
    cacheLife({ stale: Math.min(profile.stale, revalidate), revalidate, expire: profile.expire })
  } else {
    cacheLife(profile)
  }

  const weeks: WeekSummary[] = weekRows.map((w) => {
    const weekAssignments = assignments.filter((a) => a.weekNumber === w.week_number && a.isLatest)
    const hasNotes = notes.some((n) => n.weekNumber === w.week_number)
    const hasGraded = weekAssignments.some((a) => a.type === 'graded')
    const hasPractice = weekAssignments.some((a) => a.type === 'practice')
    const hasResources = resources.some((r) => r.weekId === w.id)
    return {
      id: w.id,
      number: w.week_number,
      title: w.title,
      summary: w.summary,
      topics: w.topics,
      path: weekPath(program.slug, course.slug, w.week_number),
      hasContent: hasNotes || weekAssignments.length > 0 || hasResources,
      hasGraded,
      hasPractice,
      hasNotes,
    }
  })

  const livePrograms = new Map(programs.map((p) => [p.id, p]))
  const alsoIn = (crossRes.data ?? []).flatMap((row) => {
    const p = livePrograms.get(row.program_id)
    return p && p.id !== program.id
      ? [{ id: p.id, slug: p.slug, name: p.name, shortName: p.shortName, path: p.path }]
      : []
  })

  return {
    course: {
      id: course.id,
      slug: course.slug,
      name: course.name,
      shortName: course.short_name,
      code: course.code,
      aliases: course.aliases,
      path: coursePath(program.slug, course.slug),
      program: {
        id: program.id,
        slug: program.slug,
        name: program.name,
        shortName: program.shortName,
        path: program.path,
      },
      description: course.description,
      introMdx: course.intro_mdx,
      officialUrl: course.official_url,
      credits: course.credits,
      weeksCount: course.weeks_count,
      updatedAt: course.updated_at,
      seo: toSeo(course),
      alsoIn,
    },
    weeks,
    notes,
    assignments,
    resources,
    siblings: (siblingsRes.data ?? []).map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      shortName: s.short_name,
      path: coursePath(program.slug, s.slug),
    })),
  }
}

/** Course hub: the core plus course-level FAQs. */
export async function getCoursePage(
  programSlug: string,
  courseSlug: string,
): Promise<CoursePageData | null> {
  'use cache'
  cacheLife(await contentCacheProfile())
  cacheTag(...CORE_TAGS, tableTag('faqs'))

  const core = await getCourseCore(programSlug, courseSlug)
  if (!core) return null

  const { data, error } = await getPublicClient()
    .from('faqs')
    .select('id, question, answer_mdx')
    .eq('scope', 'course')
    .eq('scope_id', core.course.id)
    .order('sort_order')
  if (error) console.error('[data/courses] faqs failed:', error.message)

  return { ...core, faqs: (data ?? []).map(toFaq) }
}

/** Every live (programme, course) pair — for generateStaticParams. */
export async function getCourseParams(): Promise<Array<{ program: string; course: string }>> {
  'use cache'
  cacheLife(await contentCacheProfile())
  cacheTag(tableTag('programs'), tableTag('courses'))

  const programs = await getPrograms()
  const bySlug = new Map(programs.map((p) => [p.id, p.slug]))
  const { data, error } = await getPublicClient().from('courses').select('slug, program_id')
  if (error) {
    console.error('[data/courses] params failed:', error.message)
    return []
  }
  return data.flatMap((row) => {
    const program = bySlug.get(row.program_id)
    return program ? [{ program, course: row.slug }] : []
  })
}

/** Course names and aliases, used to understand search queries. */
export async function getCourseAliasIndex(): Promise<
  Array<{ id: string; programSlug: string; slug: string; shortName: string; terms: string[] }>
> {
  'use cache'
  cacheLife(await contentCacheProfile())
  cacheTag(tableTag('programs'), tableTag('courses'))

  const programs = await getPrograms()
  const bySlug = new Map(programs.map((p) => [p.id, p.slug]))
  // Programme order decides which course a shared name ("maths 1") means first.
  const programOrder = new Map(programs.map((p, index) => [p.id, index]))
  const { data, error } = await getPublicClient()
    .from('courses')
    .select('id, slug, name, short_name, code, aliases, program_id, sort_order')
  if (error) {
    console.error('[data/courses] alias index failed:', error.message)
    return []
  }
  const ordered = [...data].sort(
    (a, b) =>
      (programOrder.get(a.program_id) ?? 99) - (programOrder.get(b.program_id) ?? 99) ||
      a.sort_order - b.sort_order,
  )
  return ordered.flatMap((row) => {
    const programSlug = bySlug.get(row.program_id)
    if (!programSlug) return []
    return [
      {
        id: row.id,
        programSlug,
        slug: row.slug,
        shortName: row.short_name,
        terms: [
          row.name,
          row.short_name,
          row.code ?? '',
          row.slug.replace(/-/g, ' '),
          ...row.aliases,
        ].filter(Boolean),
      },
    ]
  })
}
