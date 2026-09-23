import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'

import { tableTag } from '@/lib/cache/tags'
import { getPublicClient } from '@/lib/supabase/public'

export type SeoOverride = {
  title: string | null
  description: string | null
  canonical: string | null
  noindex: boolean | null
  ogImagePublicId: string | null
}

/** Admin-managed per-path overrides, applied last when building metadata. */
export async function getSeoOverrides(): Promise<Record<string, SeoOverride>> {
  'use cache'
  cacheLife('settings')
  cacheTag(tableTag('seo_overrides'))

  const { data, error } = await getPublicClient()
    .from('seo_overrides')
    .select('path, title, description, canonical, noindex, og_image_public_id')

  if (error) {
    console.error('[data/seo-overrides] failed:', error.message)
    return {}
  }
  return Object.fromEntries(
    data.map((row) => [
      row.path,
      {
        title: row.title,
        description: row.description,
        canonical: row.canonical,
        noindex: row.noindex,
        ogImagePublicId: row.og_image_public_id,
      },
    ]),
  )
}
