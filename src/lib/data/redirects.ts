import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'
import { notFound, permanentRedirect, redirect } from 'next/navigation'

import { tableTag } from '@/lib/cache/tags'
import { emptyRedirectMap, findRedirect, type RedirectMap } from '@/lib/redirects'
import { getPublicClient } from '@/lib/supabase/public'

const asRecord = <T>(value: unknown): Record<string, T> =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, T>) : {}

/** Redirects, programme/course aliases and cross-listings from the route manifest. */
export async function getRedirectMap(): Promise<RedirectMap> {
  'use cache'
  cacheLife('settings')
  cacheTag(
    tableTag('redirects'),
    tableTag('programs'),
    tableTag('courses'),
    tableTag('course_programs'),
  )

  const { data, error } = await getPublicClient().rpc('get_route_manifest')
  if (error || !data || typeof data !== 'object') {
    if (error) console.error('[data/redirects] manifest failed:', error.message)
    return emptyRedirectMap
  }
  const manifest = data as Record<string, unknown>
  return {
    exact: asRecord<[string, number]>(manifest.redirects),
    programAliases: asRecord<string>(manifest.program_aliases),
    courseAliases: asRecord<string>(manifest.course_aliases),
    crossListed: asRecord<string>(manifest.cross_listed),
  }
}

/**
 * Call instead of notFound() in public pages: sends old URLs, alias spellings
 * ("math-1") and cross-listed programme paths to their canonical URL with a
 * permanent redirect, and 404s everything else. Runs before any streaming, so
 * the redirect is a real HTTP 301/308.
 */
export async function redirectOrNotFound(pathname: string): Promise<never> {
  const target = findRedirect(pathname, await getRedirectMap())
  if (target) {
    if (target.status === 302 || target.status === 307) redirect(target.to)
    permanentRedirect(target.to)
  }
  notFound()
}
