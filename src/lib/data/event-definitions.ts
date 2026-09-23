import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'

import { getServiceClient } from '@/lib/supabase/admin'

/** Active event names — the /api/track allow-list (managed in the admin). */
export async function getActiveEventNames(): Promise<string[]> {
  'use cache'
  cacheLife({ stale: 300, revalidate: 600, expire: 86400 })
  cacheTag('t:event_definitions')

  const db = getServiceClient()
  if (!db) return []
  const { data, error } = await db.from('event_definitions').select('name').eq('is_active', true)
  if (error) {
    console.error('[analytics] event definitions unavailable:', error.message)
    return []
  }
  return data.map((row) => row.name)
}
