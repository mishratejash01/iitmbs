import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'

import { tableTag } from '@/lib/cache/tags'
import { coursePath, programPath } from '@/lib/routes'
import { getPublicClient } from '@/lib/supabase/public'

import { SEO_COLUMNS, toFaq, toProgramRef, toSeo } from './mappers'
import { contentCacheProfile } from './settings'
import type { Faq, ProgramRef, SeoFields } from './types'

export type ProgramDetail = ProgramRef & {
  description: string | null
  introMdx: string | null
  officialUrl: string | null
  aliases: string[]
  updatedAt: string
  seo: SeoFields
}

export type CourseCard = {
  id: string
  slug: string
  name: string
  shortName: string
  code: string | null
  description: string | null
  weeksCount: number
  path: string
  /** Set when the course's canonical home is another programme. */
  homeProgram: string | null
}

export type ProgramPageData = {
  program: ProgramDetail
  courses: CourseCard[]
  weeks: Array<{ number: number; path: string; hasContent: boolean }>
  faqs: Faq[]
}

/** Live programmes in display order. */
export async function getPrograms(): Promise<Array<ProgramRef & { description: string | null }>> {
  'use cache'
  cacheLife(await contentCacheProfile())
  cacheTag(tableTag('programs'))

  const { data, error } = await getPublicClient()
    .from('programs')
    .select('id, slug, name, short_name, description')
    .order('sort_order')

  if (error) {
    console.error('[data/programs] list failed:', error.message)
    return []
  }
  return data.map((row) => ({ ...toProgramRef(row), description: row.description }))
}

export async function getProgramBySlug(slug: string): Promise<ProgramDetail | null> {
  'use cache'
  cacheLife(await contentCacheProfile())
  cacheTag(tableTag('programs'))

  const { data, error } = await getPublicClient()
    .from('programs')
    .select(
      `id, slug, name, short_name, aliases, description, intro_mdx, official_url, updated_at, ${SEO_COLUMNS}`,
    )
    .eq('slug', slug)
    .maybeSingle()

  if (error) {
    console.error('[data/programs] lookup failed:', error.message)
    return null
  }
  if (!data) return null
  return {
    ...toProgramRef(data),
    aliases: data.aliases,
    description: data.description,
    introMdx: data.intro_mdx,
    officialUrl: data.official_url,
    updatedAt: data.updated_at,
    seo: toSeo(data),
  }
}

export async function getProgramPage(slug: string): Promise<ProgramPageData | null> {
  'use cache'
  cacheLife(await contentCacheProfile())
  cacheTag(
    tableTag('programs'),
    tableTag('courses'),
    tableTag('course_programs'),
    tableTag('weeks'),
    tableTag('faqs'),
    tableTag('notes'),
    tableTag('assignments'),
    tableTag('resources'),
  )

  const program = await getProgramBySlug(slug)
  if (!program) return null
  const db = getPublicClient()
  const livePrograms = new Map((await getPrograms()).map((p) => [p.id, p]))

  const [primary, crossListed, faqs, weeks] = await Promise.all([
    db
      .from('courses')
      .select('id, slug, name, short_name, code, description, weeks_count')
      .eq('program_id', program.id)
      .order('sort_order'),
    db
      .from('course_programs')
      .select(
        'sort_order, course:courses!inner(id, slug, name, short_name, code, description, weeks_count, program_id)',
      )
      .eq('program_id', program.id)
      .order('sort_order'),
    db
      .from('faqs')
      .select('id, question, answer_mdx')
      .eq('scope', 'program')
      .eq('scope_id', program.id)
      .order('sort_order'),
    db.rpc('get_program_week_numbers'),
  ])

  for (const result of [primary, crossListed, faqs, weeks]) {
    if (result.error) console.error('[data/programs] page query failed:', result.error.message)
  }

  const courses: CourseCard[] = (primary.data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortName: row.short_name,
    code: row.code,
    description: row.description,
    weeksCount: row.weeks_count,
    path: coursePath(program.slug, row.slug),
    homeProgram: null,
  }))

  for (const row of crossListed.data ?? []) {
    const course = row.course
    const home = course ? livePrograms.get(course.program_id) : undefined
    // Skip courses whose canonical programme is not live (their URL would 404).
    if (!course || !home || courses.some((c) => c.id === course.id)) continue
    courses.push({
      id: course.id,
      slug: course.slug,
      name: course.name,
      shortName: course.short_name,
      code: course.code,
      description: course.description,
      weeksCount: course.weeks_count,
      path: coursePath(home.slug, course.slug),
      homeProgram: home.shortName,
    })
  }

  return {
    program,
    courses,
    weeks: (weeks.data ?? [])
      .filter((row) => row.program_slug === program.slug)
      .map((row) => ({
        number: row.week_number,
        path: `${programPath(program.slug)}/week-${row.week_number}`,
        hasContent: row.has_content,
      })),
    faqs: (faqs.data ?? []).map(toFaq),
  }
}

/** Params for generateStaticParams. */
export async function getProgramSlugs(): Promise<string[]> {
  const programs = await getPrograms()
  return programs.map((program) => program.slug)
}
