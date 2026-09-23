/**
 * Pure redirect resolution from the route manifest. Unit tested in
 * tests/unit/redirects.test.ts.
 */

export type RedirectMap = {
  /** "/from" → [to, status] */
  exact: Record<string, [string, number]>
  /** "ds" → "data-science" */
  programAliases: Record<string, string>
  /** "data-science/math-1" → "/data-science/maths-1" */
  courseAliases: Record<string, string>
  /** "management-data-science/maths-1" → "/data-science/maths-1" */
  crossListed: Record<string, string>
}

export const emptyRedirectMap: RedirectMap = { exact: {}, programAliases: {}, courseAliases: {}, crossListed: {} }

/**
 * Returns where `pathname` should permanently redirect, or null. Aliases and
 * cross-listings keep the rest of the path, so
 * /ds/math-1/week-2/graded-assignment → /data-science/maths-1/week-2/graded-assignment.
 */
export function findRedirect(pathname: string, map: RedirectMap): { to: string; status: number } | null {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '').toLowerCase() : pathname
  const exact = map.exact[path]
  if (exact) return { to: exact[0], status: exact[1] }

  const segments = path.split('/').filter(Boolean)
  if (segments.length === 0) return null

  let [program, course, ...rest] = segments as [string, string | undefined, ...string[]]
  let changed = false

  const aliasProgram = map.programAliases[program]
  if (aliasProgram) {
    program = aliasProgram
    changed = true
  }

  if (course) {
    const key = `${program}/${course}`
    const target = map.courseAliases[key] ?? map.crossListed[key]
    if (target) {
      const suffix = rest.length > 0 ? `/${rest.join('/')}` : ''
      return { to: `${target}${suffix}`, status: 308 }
    }
  }

  if (!changed) return null
  const to = `/${[program, course, ...rest].filter(Boolean).join('/')}`
  return to === path ? null : { to, status: 308 }
}
