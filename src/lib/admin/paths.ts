import 'server-only'

import {
  assignmentPath,
  blogCategoryPath,
  blogPostPath,
  examPrepPath,
  formulaSheetPath,
  notePath,
  weekNotesPath,
  weekPath,
} from '@/lib/routes'

import { adminDb } from './records'
import type { ResourceConfig } from './resources'

/** The public URL of a record, for IndexNow pings after publishing. */
export async function publicPathFor(
  config: ResourceConfig,
  row: Record<string, unknown>,
): Promise<string | null> {
  const db = await adminDb()
  const course = async (id: unknown) => {
    const { data } = await db.from('courses').select('slug, program_id').eq('id', id).maybeSingle()
    if (!data) return null
    const { data: program } = await db
      .from('programs')
      .select('slug')
      .eq('id', data.program_id)
      .maybeSingle()
    return program ? { program: program.slug as string, course: data.slug as string } : null
  }
  const weekNumber = async (id: unknown) => {
    if (!id) return null
    const { data } = await db.from('weeks').select('week_number').eq('id', id).maybeSingle()
    return (data?.week_number as number | undefined) ?? null
  }
  switch (config.table) {
    case 'programs':
      return `/${row.slug}`
    case 'pages':
      return `/${row.path}`
    case 'blog_posts':
      return blogPostPath(String(row.slug))
    case 'blog_categories':
      return blogCategoryPath(String(row.slug))
    case 'courses': {
      const { data } = await db
        .from('programs')
        .select('slug')
        .eq('id', row.program_id)
        .maybeSingle()
      return data ? `/${data.slug}/${row.slug}` : null
    }
    case 'weeks': {
      const c = await course(row.course_id)
      return c ? weekPath(c.program, c.course, Number(row.week_number)) : null
    }
    case 'assignments': {
      const [c, n] = await Promise.all([course(row.course_id), weekNumber(row.week_id)])
      if (!c) return null
      if (n === null) return examPrepPath(c.program, c.course)
      return row.type === 'activity'
        ? weekPath(c.program, c.course, n)
        : assignmentPath(c.program, c.course, n, row.type as 'graded' | 'practice')
    }
    case 'notes': {
      const [c, n] = await Promise.all([course(row.course_id), weekNumber(row.week_id)])
      if (!c) return null
      if (row.kind === 'week' && n !== null) return weekNotesPath(c.program, c.course, n)
      if (row.kind === 'formula_sheet') return formulaSheetPath(c.program, c.course)
      if (row.kind === 'exam_prep') return examPrepPath(c.program, c.course)
      return notePath(c.program, c.course, String(row.slug))
    }
    default:
      return null
  }
}
