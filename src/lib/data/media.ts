import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'

import { tableTag } from '@/lib/cache/tags'
import { getPublicClient } from '@/lib/supabase/public'

import { contentCacheProfile } from './settings'

export type MediaInfo = {
  publicId: string
  width: number | null
  height: number | null
  alt: string
  caption: string | null
  credit: string | null
}

/** Dimensions and alt text for images referenced from MDX. */
export async function getMediaMap(publicIds: string[]): Promise<Record<string, MediaInfo>> {
  'use cache'
  cacheLife(await contentCacheProfile())
  cacheTag(tableTag('media'))

  const ids = [...new Set(publicIds)].sort()
  if (ids.length === 0) return {}

  const { data, error } = await getPublicClient()
    .from('media')
    .select('public_id, width, height, alt_text, caption, credit')
    .in('public_id', ids)

  if (error) {
    console.error('[data/media] lookup failed:', error.message)
    return {}
  }
  return Object.fromEntries(
    data.map((row) => [
      row.public_id,
      {
        publicId: row.public_id,
        width: row.width,
        height: row.height,
        alt: row.alt_text ?? '',
        caption: row.caption,
        credit: row.credit,
      },
    ]),
  )
}
