import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'

import { tableTag } from '@/lib/cache/tags'
import { getPublicClient } from '@/lib/supabase/public'

import { contentCacheProfile } from './settings'
import type { LinkIndexEntry } from './types'

/**
 * Every live URL with its title and summary. Resolves <RelatedLink href=…/>
 * in MDX and feeds the 404 page's suggestions.
 */
export async function getLinkIndex(): Promise<Record<string, LinkIndexEntry>> {
  'use cache'
  cacheLife(await contentCacheProfile())
  cacheTag(
    tableTag('programs'),
    tableTag('courses'),
    tableTag('weeks'),
    tableTag('assignments'),
    tableTag('notes'),
    tableTag('pages'),
    tableTag('resources'),
  )

  const { data, error } = await getPublicClient().rpc('get_link_index')
  if (error) {
    console.error('[data/links] link index failed:', error.message)
    return {}
  }
  return Object.fromEntries(
    data.map((row) => [
      row.path,
      { path: row.path, title: row.title, summary: row.summary, kind: row.kind as LinkIndexEntry['kind'] },
    ]),
  )
}
