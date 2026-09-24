import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'

import { tableTag } from '@/lib/cache/tags'
import { noteCoursePath } from '@/lib/routes'
import { getPublicClient } from '@/lib/supabase/public'

import { RESOURCE_COLUMNS, SEO_COLUMNS, toResource, toSeo } from './mappers'
import { contentCacheProfile } from './settings'
import type { ResourceItem, SeoFields } from './types'

export type NoteLevel = 'foundation' | 'diploma' | 'degree'

export const NOTE_LEVELS: Array<{ level: NoteLevel; label: string }> = [
  { level: 'foundation', label: 'Foundation' },
  { level: 'diploma', label: 'Diploma' },
  { level: 'degree', label: 'Degree' },
]

export type NoteCourse = {
  id: string
  code: string
  slug: string
  path: string
  name: string
  shortName: string
  level: NoteLevel
  courseId: string | null
  blogPostId: string | null
  noteCount: number
  updatedAt: string
  seo: SeoFields
}

const PAGE_SIZE = 1000

/** The course of every live note. The API returns at most 1000 rows a request, so this pages. */
async function allNoteCourseIds(): Promise<string[]> {
  const db = getPublicClient()
  const ids: string[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await db
      .from('resources')
      .select('note_course_id')
      .not('note_course_id', 'is', null)
      .order('id')
      .range(from, from + PAGE_SIZE - 1)
    if (error) {
      console.error('[data/student-notes] counts failed:', error.message)
      break
    }
    for (const row of data) if (row.note_course_id) ids.push(row.note_course_id)
    if (data.length < PAGE_SIZE) break
  }
  return ids
}

/**
 * Every live course that has at least one live note, in display order.
 * RLS hides unpublished notes, so the counts are what visitors can open.
 */
export async function getNoteCourses(): Promise<NoteCourse[]> {
  'use cache'
  cacheLife(await contentCacheProfile())
  cacheTag(tableTag('note_courses'), tableTag('resources'))

  const db = getPublicClient()
  const [courses, notes] = await Promise.all([
    db
      .from('note_courses')
      .select(
        `id, code, slug, name, short_name, level, course_id, blog_post_id, updated_at, ${SEO_COLUMNS}`,
      )
      .order('sort_order')
      .order('name'),
    allNoteCourseIds(),
  ])
  if (courses.error) {
    console.error('[data/student-notes] courses failed:', courses.error.message)
    return []
  }
  const counts = new Map<string, number>()
  for (const id of notes) counts.set(id, (counts.get(id) ?? 0) + 1)
  return courses.data
    .map((row) => ({
      id: row.id,
      code: row.code,
      slug: row.slug,
      path: noteCoursePath(row.slug),
      name: row.name,
      shortName: row.short_name,
      level: row.level as NoteLevel,
      courseId: row.course_id,
      blogPostId: row.blog_post_id,
      noteCount: counts.get(row.id) ?? 0,
      updatedAt: row.updated_at,
      seo: toSeo(row),
    }))
    .filter((course) => course.noteCount > 0)
}

/** One course's notes, most used first. */
export async function getCourseNotes(noteCourseId: string): Promise<ResourceItem[]> {
  'use cache'
  cacheLife(await contentCacheProfile())
  cacheTag(tableTag('resources'))

  const { data, error } = await getPublicClient()
    .from('resources')
    .select(RESOURCE_COLUMNS)
    .eq('note_course_id', noteCourseId)
    .order('sort_order')
    .order('title')

  if (error) {
    console.error('[data/student-notes] notes failed:', error.message)
    return []
  }
  return data.map(toResource)
}
