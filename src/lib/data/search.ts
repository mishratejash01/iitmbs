import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'

import { tableTag } from '@/lib/cache/tags'
import { assignmentPath, examPrepPath, formulaSheetPath, weekNotesPath, weekPath } from '@/lib/routes'
import { parseSearchQuery, type ParsedQuery, type SearchKind } from '@/lib/search/parse'
import { getPublicClient } from '@/lib/supabase/public'

import { getCourseAliasIndex, getCourseCore } from './courses'

export type SearchResult = {
  path: string
  title: string
  subtitle: string | null
  entityType: string
  kind: string | null
  weekNumber: number | null
  /** Snippet with matches wrapped in \u0002 … \u0003 (rendered as <mark>). */
  snippet: string
}

export type SearchResponse = {
  parsed: ParsedQuery
  /** An exact destination when the query names a course + week (+ kind). */
  directHit: { path: string; label: string } | null
  results: SearchResult[]
}

const RPC_KIND: Partial<Record<SearchKind, string>> = {
  graded: 'graded',
  practice: 'practice',
  note: 'note',
  formula_sheet: 'formula_sheet',
  exam_prep: 'exam_prep',
}

async function resolveDirectHit(parsed: ParsedQuery): Promise<SearchResponse['directHit']> {
  const course = parsed.course
  if (!course) return null
  const core = await getCourseCore(course.programSlug, course.slug)
  if (!core) return null

  if (parsed.kind === 'formula_sheet' && core.notes.some((n) => n.kind === 'formula_sheet')) {
    return { path: formulaSheetPath(course.programSlug, course.slug), label: `${course.shortName} formula sheet` }
  }
  if (parsed.kind === 'exam_prep' && core.notes.some((n) => n.kind === 'exam_prep')) {
    return { path: examPrepPath(course.programSlug, course.slug), label: `${course.shortName} exam preparation` }
  }
  if (parsed.week === null) return null
  const week = core.weeks.find((w) => w.number === parsed.week)
  if (!week) return null

  if (parsed.kind === 'graded' && week.hasGraded) {
    return {
      path: assignmentPath(course.programSlug, course.slug, week.number, 'graded'),
      label: `${course.shortName} Week ${week.number} Graded Assignment`,
    }
  }
  if (parsed.kind === 'practice' && week.hasPractice) {
    return {
      path: assignmentPath(course.programSlug, course.slug, week.number, 'practice'),
      label: `${course.shortName} Week ${week.number} Practice Assignment`,
    }
  }
  if (parsed.kind === 'note' && core.notes.some((n) => n.kind === 'week' && n.weekNumber === week.number)) {
    return {
      path: weekNotesPath(course.programSlug, course.slug, week.number),
      label: `${course.shortName} Week ${week.number} Notes`,
    }
  }
  return {
    path: weekPath(course.programSlug, course.slug, week.number),
    label: `${course.shortName} Week ${week.number}: ${week.title}`,
  }
}

/** Parses and runs a site search. Cached per query for a few minutes. */
export async function searchSite(query: string, limit = 20): Promise<SearchResponse> {
  'use cache'
  cacheLife('search')
  cacheTag('search', tableTag('courses'), tableTag('weeks'), tableTag('notes'), tableTag('assignments'))

  const parsed = parseSearchQuery(query, await getCourseAliasIndex())
  if (!parsed.normalized) return { parsed, directHit: null, results: [] }

  const [directHit, rpc] = await Promise.all([
    resolveDirectHit(parsed),
    getPublicClient().rpc('search_content', {
      p_query: parsed.text,
      p_course_id: parsed.course?.id ?? undefined,
      p_week: parsed.week ?? undefined,
      p_kind: parsed.kind ? RPC_KIND[parsed.kind] : undefined,
      p_limit: limit,
    }),
  ])
  if (rpc.error) console.error('[data/search] search failed:', rpc.error.message)

  let rows = rpc.data ?? []
  // If the structured filters were too narrow, fall back to plain text search.
  if (rows.length === 0 && (parsed.course || parsed.week || parsed.kind)) {
    const fallback = await getPublicClient().rpc('search_content', {
      p_query: parsed.normalized,
      p_limit: limit,
    })
    rows = fallback.data ?? []
  }

  return {
    parsed,
    directHit,
    results: rows.map((row) => ({
      path: row.path,
      title: row.title,
      subtitle: row.subtitle,
      entityType: row.entity_type,
      kind: row.kind,
      weekNumber: row.week_number,
      snippet: row.snippet ?? '',
    })),
  }
}
