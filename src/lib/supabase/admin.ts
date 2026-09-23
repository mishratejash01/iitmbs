import 'server-only'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import { env } from '@/env'

import type { Database } from './database.types'

let client: SupabaseClient<Database> | null | undefined

/**
 * Privileged client (secret / service-role key). Bypasses RLS — use only for
 * server-side jobs that must: analytics ingest, download counting, account
 * deletion and data export. Returns null when the key is not configured so
 * callers can degrade gracefully.
 */
export function getServiceClient(): SupabaseClient<Database> | null {
  if (client !== undefined) return client
  client = env.supabaseServiceRoleKey
    ? createClient<Database>(env.supabaseUrl, env.supabaseServiceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        global: { headers: { 'x-client-info': 'qualifier-hub/service' } },
      })
    : null
  return client
}
