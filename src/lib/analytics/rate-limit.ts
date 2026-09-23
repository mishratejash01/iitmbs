import 'server-only'

import { getServiceClient } from '@/lib/supabase/admin'

/**
 * Two-layer rate limiting: a per-instance sliding window stops floods
 * cheaply, then a shared Postgres window (check_rate_limit) enforces the
 * limit across all serverless instances.
 */
const memory = new Map<string, { windowStart: number; hits: number }>()

function allowInMemory(key: string, windowMs: number, max: number): boolean {
  const now = Date.now()
  const entry = memory.get(key)
  if (!entry || now - entry.windowStart >= windowMs) {
    memory.set(key, { windowStart: now, hits: 1 })
    if (memory.size > 10_000) {
      for (const [k, v] of memory) if (now - v.windowStart >= windowMs) memory.delete(k)
    }
    return true
  }
  entry.hits += 1
  return entry.hits <= max
}

export async function allowRequest(
  key: string,
  windowSeconds: number,
  max: number,
): Promise<boolean> {
  if (!allowInMemory(key, windowSeconds * 1000, max)) return false
  const db = getServiceClient()
  if (!db) return true
  const { data, error } = await db.rpc('check_rate_limit', {
    p_bucket: key,
    p_window_seconds: windowSeconds,
    p_max_hits: max,
  })
  // Fail open on database errors: analytics must never block the site.
  return error ? true : data !== false
}
