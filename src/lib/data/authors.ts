import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'

import { tableTag } from '@/lib/cache/tags'
import { getPublicClient } from '@/lib/supabase/public'

import { toAuthor } from './mappers'
import { contentCacheProfile } from './settings'
import type { AuthorRef } from './types'

/** Authors keyed by id (bylines and schema.org Person markup). */
export async function getAuthorsByIds(ids: string[]): Promise<Record<string, AuthorRef>> {
  'use cache'
  cacheLife(await contentCacheProfile())
  cacheTag(tableTag('authors'))

  const unique = [...new Set(ids)].sort()
  if (unique.length === 0) return {}

  const { data, error } = await getPublicClient()
    .from('authors')
    .select('id, slug, name, headline, credentials, avatar_public_id, same_as')
    .in('id', unique)

  if (error) {
    console.error('[data/authors] lookup failed:', error.message)
    return {}
  }
  return Object.fromEntries(data.map((row) => [row.id, toAuthor(row)]))
}
