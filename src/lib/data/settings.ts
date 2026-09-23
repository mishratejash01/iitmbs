import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'

import { tableTag } from '@/lib/cache/tags'
import { fallbackSettings, parseSiteSettings, type SiteSettings } from '@/lib/settings/schema'
import { getPublicClient } from '@/lib/supabase/public'

/** The validated site settings document (defaults fill any gaps). */
export async function getSiteSettings(): Promise<SiteSettings> {
  'use cache'
  cacheLife('settings')
  cacheTag(tableTag('site_settings'))

  const { data, error } = await getPublicClient()
    .from('site_settings')
    .select('data')
    .eq('id', true)
    .maybeSingle()

  if (error) {
    console.error('[data/settings] using fallback settings:', error.message)
    return fallbackSettings
  }
  return parseSiteSettings(data?.data)
}

/**
 * Cache profile for published content. The revalidate interval comes from
 * site_settings.revalidate_seconds (a safety net — publishing revalidates
 * on demand).
 */
export async function contentCacheProfile() {
  const settings = await getSiteSettings()
  return {
    stale: 300,
    revalidate: settings.revalidate_seconds,
    expire: 60 * 60 * 24 * 30,
  }
}
