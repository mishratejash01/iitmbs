import 'server-only'

import { getProgramPage, getPrograms } from './programs'

/** Paths of the qualifier course hubs, by course id. */
export async function getCourseHubPaths(): Promise<Map<string, string>> {
  const programs = await getPrograms()
  const pages = await Promise.all(programs.map((p) => getProgramPage(p.slug)))
  return new Map(pages.flatMap((page) => page?.courses.map((c) => [c.id, c.path] as const) ?? []))
}
