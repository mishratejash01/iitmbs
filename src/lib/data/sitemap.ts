import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'

import { tableTag } from '@/lib/cache/tags'
import { getServiceClient } from '@/lib/supabase/admin'
import { getPublicClient } from '@/lib/supabase/public'

import { withRetry } from './retry'
import { contentCacheProfile } from './settings'

export const SITEMAP_SECTIONS = [
  'programs',
  'courses',
  'weeks',
  'assignments',
  'notes',
  'pages',
  'blog',
  'pyq',
  'lectures',
] as const
export type SitemapSection = (typeof SITEMAP_SECTIONS)[number]

export type SitemapEntry = { section: SitemapSection; path: string; lastModified: string }

const PAGE_SIZE = 1000

/**
 * Indexable URLs only: live, not noindex, and — for week hubs — with enough
 * content to be worth indexing (the same rule the pages use for robots).
 */
export async function getSitemapEntries(): Promise<SitemapEntry[]> {
  'use cache'
  cacheLife(await contentCacheProfile())
  cacheTag(
    'sitemap',
    tableTag('programs'),
    tableTag('courses'),
    tableTag('weeks'),
    tableTag('assignments'),
    tableTag('notes'),
    tableTag('resources'),
    tableTag('pages'),
    tableTag('blog_posts'),
    tableTag('blog_categories'),
    tableTag('note_courses'),
    tableTag('question_papers'),
    tableTag('lecture_videos'),
  )

  // The API returns at most 1000 rows a request, so this pages (in a stable order).
  const data: Array<{ section: string; path: string; last_modified: string }> = []
  // The server key: anon's 3 s statement timeout is too tight while a build
  // renders thousands of pages at once. The sitemap holds only public paths.
  const db = getServiceClient() ?? getPublicClient()
  for (let from = 0; ; from += PAGE_SIZE) {
    const page = await withRetry(() =>
      db
        .rpc('get_sitemap_entries')
        .order('path')
        .range(from, from + PAGE_SIZE - 1),
    )
    // Never cache a partial sitemap: an error keeps the last good copy live.
    if (page.error) throw new Error(`[data/sitemap] entries failed: ${page.error.message}`)
    data.push(...page.data)
    if (page.data.length < PAGE_SIZE) break
  }
  return data
    .filter((row): row is typeof row & { section: SitemapSection } =>
      (SITEMAP_SECTIONS as readonly string[]).includes(row.section),
    )
    .map((row) => ({ section: row.section, path: row.path, lastModified: row.last_modified }))
}
