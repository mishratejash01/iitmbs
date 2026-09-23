import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'

import { tableTag } from '@/lib/cache/tags'
import { getPublicClient } from '@/lib/supabase/public'

import { contentCacheProfile } from './settings'

export const SITEMAP_SECTIONS = [
  'programs',
  'courses',
  'weeks',
  'assignments',
  'notes',
  'pages',
] as const
export type SitemapSection = (typeof SITEMAP_SECTIONS)[number]

export type SitemapEntry = { section: SitemapSection; path: string; lastModified: string }

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
  )

  const { data, error } = await getPublicClient().rpc('get_sitemap_entries')
  if (error) {
    console.error('[data/sitemap] entries failed:', error.message)
    return []
  }
  return data
    .filter((row): row is typeof row & { section: SitemapSection } =>
      (SITEMAP_SECTIONS as readonly string[]).includes(row.section),
    )
    .map((row) => ({ section: row.section, path: row.path, lastModified: row.last_modified }))
}
