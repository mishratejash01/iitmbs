import 'server-only'

import type { FieldOption, ReferenceKey } from './fields'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * Option lists for reference fields. Loaded with the staff member's own
 * session (RLS lets staff see drafts), labelled so ambiguous items — two
 * "English I" courses, many "Week 1"s — are easy to tell apart.
 */
export async function loadReferenceOptions(
  keys: ReferenceKey[],
): Promise<Partial<Record<ReferenceKey, FieldOption[]>>> {
  const wanted = new Set(keys)
  if (wanted.has('faqScopes'))
    ['programs', 'courses', 'weeks', 'assignments'].forEach((k) => wanted.add(k as ReferenceKey))
  const supabase = await createSupabaseServerClient()

  const [programs, courses, weeks, assignments, authors, pages] = await Promise.all([
    wanted.has('programs') ||
    wanted.has('courses') ||
    wanted.has('weeks') ||
    wanted.has('assignments')
      ? supabase
          .from('programs')
          .select('id, short_name')
          .is('deleted_at', null)
          .order('sort_order')
      : null,
    wanted.has('courses') || wanted.has('weeks') || wanted.has('assignments')
      ? supabase
          .from('courses')
          .select('id, short_name, program_id')
          .is('deleted_at', null)
          .order('sort_order')
      : null,
    wanted.has('weeks') || wanted.has('assignments')
      ? supabase
          .from('weeks')
          .select('id, week_number, title, course_id')
          .is('deleted_at', null)
          .order('week_number')
      : null,
    wanted.has('assignments')
      ? supabase
          .from('assignments')
          .select('id, type, term, course_id, week_id')
          .is('deleted_at', null)
          .order('term', { ascending: false })
      : null,
    wanted.has('authors') ? supabase.from('authors').select('id, name').order('name') : null,
    wanted.has('faqScopes')
      ? supabase.from('pages').select('id, title').is('deleted_at', null).order('path')
      : null,
  ])

  const programName = new Map((programs?.data ?? []).map((p) => [p.id, p.short_name]))
  const courseLabel = new Map(
    (courses?.data ?? []).map((c) => [
      c.id,
      `${c.short_name} (${programName.get(c.program_id) ?? '—'})`,
    ]),
  )
  const weekLabel = new Map(
    (weeks?.data ?? []).map((w) => [
      w.id,
      `${courseLabel.get(w.course_id) ?? '—'} · Week ${w.week_number}: ${w.title}`,
    ]),
  )

  const result: Partial<Record<ReferenceKey, FieldOption[]>> = {}
  if (wanted.has('programs'))
    result.programs = (programs?.data ?? []).map((p) => ({ value: p.id, label: p.short_name }))
  if (wanted.has('courses'))
    result.courses = [...courseLabel].map(([value, label]) => ({ value, label }))
  if (wanted.has('weeks')) result.weeks = [...weekLabel].map(([value, label]) => ({ value, label }))
  if (wanted.has('assignments')) {
    result.assignments = (assignments?.data ?? []).map((a) => ({
      value: a.id,
      label: `${a.week_id ? (weekLabel.get(a.week_id) ?? '—') : `${courseLabel.get(a.course_id) ?? '—'} · course-level`} · ${a.type} · ${a.term}`,
    }))
  }
  if (wanted.has('authors'))
    result.authors = (authors?.data ?? []).map((a) => ({ value: a.id, label: a.name }))
  if (wanted.has('faqScopes')) {
    result.faqScopes = [
      ...(result.programs ?? []).map((o) => ({ value: o.value, label: `Programme · ${o.label}` })),
      ...(result.courses ?? []).map((o) => ({ value: o.value, label: `Course · ${o.label}` })),
      ...(result.weeks ?? []).map((o) => ({ value: o.value, label: `Week · ${o.label}` })),
      ...(result.assignments ?? []).map((o) => ({
        value: o.value,
        label: `Assignment · ${o.label}`,
      })),
      ...(pages?.data ?? []).map((p) => ({ value: p.id, label: `Page · ${p.title}` })),
    ]
  }
  return result
}
