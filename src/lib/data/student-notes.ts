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

/** Live notes per course, counted by the database (get_note_counts). */
async function noteCounts(): Promise<Map<string, number>> {
  const { data, error } = await getPublicClient().rpc('get_note_counts')
  if (error) {
    console.error('[data/student-notes] counts failed:', error.message)
    return new Map()
  }
  return new Map(data.map((row) => [row.note_course_id, row.note_count]))
}

/**
 * Every live course that has at least one live note, in display order.
 * Only live notes are counted, so the counts are what visitors can open.
 */
export async function getNoteCourses(): Promise<NoteCourse[]> {
  'use cache'
  cacheLife(await contentCacheProfile())
  cacheTag(tableTag('note_courses'), tableTag('resources'))

  const db = getPublicClient()
  const [courses, counts] = await Promise.all([
    db
      .from('note_courses')
      .select(
        `id, code, slug, name, short_name, level, course_id, blog_post_id, updated_at, ${SEO_COLUMNS}`,
      )
      .order('sort_order')
      .order('name'),
    noteCounts(),
  ])
  if (courses.error) {
    console.error('[data/student-notes] courses failed:', courses.error.message)
    return []
  }
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
