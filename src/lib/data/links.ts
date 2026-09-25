import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'

import { tableTag } from '@/lib/cache/tags'
import { getServiceClient } from '@/lib/supabase/admin'
import { getPublicClient } from '@/lib/supabase/public'

import { withRetry } from './retry'
import { contentCacheProfile } from './settings'
import type { LinkIndexEntry } from './types'

const PAGE_SIZE = 1000

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
    tableTag('blog_posts'),
    tableTag('blog_categories'),
    tableTag('note_courses'),
    tableTag('question_papers'),
    tableTag('lecture_videos'),
  )

  // The API returns at most 1000 rows a request, so this pages (in a stable order).
  const data: Array<{ path: string; title: string; summary: string; kind: string }> = []
  // The server key: anon's 3 s statement timeout is too tight while a build
  // renders thousands of pages at once. The link index holds only public paths.
  const db = getServiceClient() ?? getPublicClient()
  for (let from = 0; ; from += PAGE_SIZE) {
    const page = await withRetry(() =>
      db
        .rpc('get_link_index')
        .order('path')
        .range(from, from + PAGE_SIZE - 1),
    )
    // Never cache a partial index: an error keeps the last good copy live.
    if (page.error) throw new Error(`[data/links] link index failed: ${page.error.message}`)
    data.push(...page.data)
    if (page.data.length < PAGE_SIZE) break
  }
  return Object.fromEntries(
    data.map((row) => [
      row.path,
      {
        path: row.path,
        title: row.title,
        summary: row.summary,
        kind: row.kind as LinkIndexEntry['kind'],
      },
    ]),
  )
}
