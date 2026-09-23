import 'server-only'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import { env } from '@/env'

import type { Database } from './database.types'

let client: SupabaseClient<Database> | undefined

/**
 * Cookie-less client using the publishable (anon) key. Used by the cached,
 * statically rendered public pages: it never reads the visitor's session, so
 * RLS limits it to live content and it is safe to share across requests.
 */
export function getPublicClient(): SupabaseClient<Database> {
  client ??= createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { 'x-client-info': 'qualifier-hub/public' } },
  })
  return client
}
