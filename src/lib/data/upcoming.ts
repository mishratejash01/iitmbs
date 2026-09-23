import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'

import { tableTag } from '@/lib/cache/tags'
import { assignmentPath } from '@/lib/routes'
import { getPublicClient } from '@/lib/supabase/public'

import { getPrograms } from './programs'
import { getSiteSettings } from './settings'

export type Deadline = {
  id: string
  courseShortName: string
  programShortName: string
  weekNumber: number
  title: string
  dueAt: string
  solutionsReleaseAt: string
  path: string
}

/**
 * Graded assignments of the current term due between yesterday and six weeks
 * ahead. The page filters past deadlines on the client, so this can be cached
 * for an hour without showing stale "upcoming" items.
 */
export async function getUpcomingDeadlines(): Promise<Deadline[]> {
  'use cache'
  cacheLife('hours')
  cacheTag(
    tableTag('assignments'),
    tableTag('courses'),
    tableTag('weeks'),
    tableTag('site_settings'),
  )

  const settings = await getSiteSettings()
  if (!settings.current_term) return []

  const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const to = new Date(Date.now() + 42 * 24 * 60 * 60 * 1000).toISOString()

  const [assignments, programs] = await Promise.all([
    getPublicClient()
      .from('assignments')
      .select(
        'id, title, due_at, solutions_release_at, week:weeks!inner(week_number), course:courses!inner(slug, short_name, program_id)',
      )
      .eq('type', 'graded')
      .eq('term', settings.current_term)
      .gte('due_at', from)
      .lte('due_at', to)
      .order('due_at'),
    getPrograms(),
  ])

  if (assignments.error) {
    console.error('[data/upcoming] failed:', assignments.error.message)
    return []
  }
  const byId = new Map(programs.map((p) => [p.id, p]))
  return assignments.data.flatMap((row) => {
    const program = byId.get(row.course.program_id)
    if (!program || !row.due_at) return []
    return [
      {
        id: row.id,
        courseShortName: row.course.short_name,
        programShortName: program.shortName,
        weekNumber: row.week.week_number,
        title: row.title,
        dueAt: row.due_at,
        solutionsReleaseAt: row.solutions_release_at,
        path: assignmentPath(program.slug, row.course.slug, row.week.week_number, 'graded'),
      },
    ]
  })
}
