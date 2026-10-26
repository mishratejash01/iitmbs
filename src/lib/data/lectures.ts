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
  /** The course guide post, when there is one. */
  blogPostId: string | null
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

type LectureStats = { count: number; weeks: Array<{ week: number; count: number }>; updated: string }

/**
 * Each course's live lecture count, per-week counts (weeks 1 and up, in
 * order) and latest edit, counted by the database (get_lecture_stats).
 */
async function lectureStats(): Promise<Map<string, LectureStats>> {
  const { data, error } = await getPublicClient().rpc('get_lecture_stats')
  if (error) {
    console.error('[data/lectures] lecture stats failed:', error.message)
    return new Map()
  }
  return new Map(
    data.map((row) => [
      row.note_course_id,
      {
        count: row.video_count,
        weeks: row.weeks as LectureStats['weeks'],
        updated: row.updated_at,
      },
    ]),
  )
}

/** Every live course with at least one live lecture, in display order. */
export async function getLectureCourses(): Promise<LectureCourse[]> {
  'use cache'
  cacheLife(await contentCacheProfile())
  cacheTag(tableTag('note_courses'), tableTag('lecture_videos'))

  const [courses, stats] = await Promise.all([
    getPublicClient()
      .from('note_courses')
      .select(
        'id, code, slug, name, short_name, level, course_id, blog_post_id, updated_at, programs(slug)',
      )
      .order('sort_order')
      .order('name'),
    lectureStats(),
  ])
  if (courses.error) {
    console.error('[data/lectures] courses failed:', courses.error.message)
    return []
  }

  return courses.data.flatMap((row) => {
    const entry = stats.get(row.id)
    if (!entry) return []
    const weekly = entry.weeks.reduce((sum, week) => sum + week.count, 0)
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
        blogPostId: row.blog_post_id,
        videoCount: entry.count,
        weeks: weekly * 2 >= entry.count ? entry.weeks : [],
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
