import type { Metadata } from 'next'
import { permanentRedirect } from 'next/navigation'

import { getAssignmentPage, getAssignmentParams } from '@/lib/data/assignments'
import { redirectOrNotFound } from '@/lib/data/redirects'
import { getSeoOverrides } from '@/lib/data/seo-overrides'
import { getSiteSettings } from '@/lib/data/settings'
import { assignmentPath, parseWeekSegment, type AssignmentKind } from '@/lib/routes'
import { buildMetadata } from '@/lib/seo/metadata'
import { assignmentVars } from '@/lib/seo/vars'
import { PLACEHOLDER_SEGMENT, withPlaceholder } from '@/lib/static-params'

import { AssignmentView } from './assignment-view'

type RouteParams = { program: string; course: string; week: string; term?: string }

const TERM = /^\d{4}-(jan|may|sep)$/

async function load(params: RouteParams, kind: AssignmentKind) {
  const weekNumber = parseWeekSegment(params.week)
  if (weekNumber === null) return null
  if (params.term !== undefined && !TERM.test(params.term)) return null
  return getAssignmentPage(params.program, params.course, weekNumber, kind, params.term ?? null)
}

/** Shared by the four assignment routes (graded/practice × latest/older term). */
export async function assignmentStaticParams(kind: AssignmentKind, withTerm: boolean) {
  const all = await getAssignmentParams(kind)
  const params = all
    .filter((p) => (withTerm ? p.term !== undefined : p.term === undefined))
    .map((p) => (withTerm ? p : { program: p.program, course: p.course, week: p.week }))
  const placeholder: Record<string, string> = withTerm
    ? {
        program: PLACEHOLDER_SEGMENT,
        course: PLACEHOLDER_SEGMENT,
        week: PLACEHOLDER_SEGMENT,
        term: PLACEHOLDER_SEGMENT,
      }
    : { program: PLACEHOLDER_SEGMENT, course: PLACEHOLDER_SEGMENT, week: PLACEHOLDER_SEGMENT }
  return withPlaceholder(params as Array<Record<string, string>>, placeholder)
}

export async function assignmentMetadata(
  params: RouteParams,
  kind: AssignmentKind,
): Promise<Metadata> {
  const [data, settings, overrides] = await Promise.all([
    load(params, kind),
    getSiteSettings(),
    getSeoOverrides(),
  ])
  const path = data?.assignment.path
  if (!data || !path) return { robots: { index: false } }
  const { core, week, assignment } = data
  const label = kind === 'graded' ? 'Graded Assignment' : 'Practice Assignment'
  return buildMetadata({
    settings,
    path,
    template: params.term ? `${kind}_assignment_term` : `${kind}_assignment`,
    vars: assignmentVars(core, week, assignment),
    fallbackTitle: `IITM ${core.course.shortName} Week ${week.number} ${label}`,
    fallbackDescription:
      assignment.summary ?? `${label} for ${core.course.name}, week ${week.number}: ${week.title}.`,
    seo: assignment.seo,
    override: overrides[path],
    type: 'article',
    publishedTime: assignment.publishedAt,
    modifiedTime: assignment.updatedAt,
  })
}

export async function AssignmentRoute({
  params,
  kind,
}: {
  params: RouteParams
  kind: AssignmentKind
}) {
  const data = await load(params, kind)
  if (!data) {
    const term = params.term ? `/${params.term}` : ''
    return redirectOrNotFound(
      `/${params.program}/${params.course}/${params.week}/${kind}-assignment${term}`,
    )
  }
  // The latest term lives at the evergreen URL; its /<term> twin redirects there.
  if (params.term && data.assignment.isLatest) {
    permanentRedirect(assignmentPath(params.program, params.course, data.week.number, kind))
  }
  return <AssignmentView data={data} />
}
