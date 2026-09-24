import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'

import { tableTag } from '@/lib/cache/tags'
import { orderLectures } from '@/lib/lectures/videos'
import { lectureCoursePath } from '@/lib/routes'
import { getPublicClient } from '@/lib/supabase/public'

import { contentCacheProfile } from './settings'
import type { NoteLevel } from './student-notes'

export type LectureCourse = {
  id: string
  code: string
  slug: string
  path: string
  name: string
  shortName: string
  level: NoteLevel
  /** The programme's slug, e.g. "data-science". */
  program: string
  courseId: string | null
  videoCount: number
  /**
   * Weeks with at least one lecture, in order, with how many each has. Empty
   * when fewer than half the lectures name their week: those courses show one
   * list instead of week pages (private.live_lecture_courses uses the same rule).
   */
  weeks: Array<{ week: number; count: number }>
  updatedAt: string
}

export type Lecture = {
  id: string
  youtubeId: string
  title: string
  week: number | null
  lecture: string | null
  durationSeconds: number | null
  uploadedAt: string | null
}

const PAGE_SIZE = 1000

/** Every live lecture's course and week. The API returns at most 1000 rows a request, so this pages. */
async function allLectureRows() {
  const db = getPublicClient()
  const rows: Array<{ note_course_id: string; week: number | null; updated_at: string }> = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await db
      .from('lecture_videos')
      .select('note_course_id, week, updated_at')
      .order('id')
      .range(from, from + PAGE_SIZE - 1)
    if (error) {
      console.error('[data/lectures] lectures failed:', error.message)
      break
    }
    rows.push(...data)
    if (data.length < PAGE_SIZE) break
  }
  return rows
}

/** Every live course with at least one live lecture, in display order. */
export async function getLectureCourses(): Promise<LectureCourse[]> {
  'use cache'
  cacheLife(await contentCacheProfile())
  cacheTag(tableTag('note_courses'), tableTag('lecture_videos'))

  const [courses, lectures] = await Promise.all([
    getPublicClient()
      .from('note_courses')
      .select('id, code, slug, name, short_name, level, course_id, updated_at, programs(slug)')
      .order('sort_order')
      .order('name'),
    allLectureRows(),
  ])
  if (courses.error) {
    console.error('[data/lectures] courses failed:', courses.error.message)
    return []
  }

  const stats = new Map<string, { count: number; weeks: Map<number, number>; updated: string }>()
  for (const row of lectures) {
    const entry = stats.get(row.note_course_id) ?? {
      count: 0,
      weeks: new Map<number, number>(),
      updated: row.updated_at,
    }
    entry.count += 1
    if (row.week !== null && row.week >= 1)
      entry.weeks.set(row.week, (entry.weeks.get(row.week) ?? 0) + 1)
    if (row.updated_at > entry.updated) entry.updated = row.updated_at
    stats.set(row.note_course_id, entry)
  }

  return courses.data.flatMap((row) => {
    const entry = stats.get(row.id)
    if (!entry) return []
    const weekly = [...entry.weeks.values()].reduce((sum, count) => sum + count, 0)
    return [
      {
        id: row.id,
        code: row.code,
        slug: row.slug,
        path: lectureCoursePath(row.slug),
        name: row.name,
        shortName: row.short_name,
        level: row.level as NoteLevel,
        program: row.programs?.slug ?? '',
        courseId: row.course_id,
        videoCount: entry.count,
        weeks:
          weekly * 2 >= entry.count
            ? [...entry.weeks.entries()]
                .sort(([a], [b]) => a - b)
                .map(([week, count]) => ({ week, count }))
            : [],
        updatedAt: entry.updated > row.updated_at ? entry.updated : row.updated_at,
      },
    ]
  })
}

/**
 * One course's lectures in teaching order (see orderLectures). For a course
 * without week pages the weeks are dropped, so the lectures form one list.
 */
export async function getCourseLectures(noteCourseId: string, weekly: boolean): Promise<Lecture[]> {
  'use cache'
  cacheLife(await contentCacheProfile())
  cacheTag(tableTag('lecture_videos'))

  const { data, error } = await getPublicClient()
    .from('lecture_videos')
    .select(
      'id, youtube_id, title, week, lecture, duration_seconds, uploaded_at, position, sort_order',
    )
    .eq('note_course_id', noteCourseId)

  if (error) {
    console.error('[data/lectures] course lectures failed:', error.message)
    return []
  }
  return orderLectures(data.map((row) => (weekly ? row : { ...row, week: null }))).map((row) => ({
    id: row.id,
    youtubeId: row.youtube_id,
    title: row.title,
    week: row.week,
    lecture: row.lecture,
    durationSeconds: row.duration_seconds,
    uploadedAt: row.uploaded_at,
  }))
}
