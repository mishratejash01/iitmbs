import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

import { clientEnv } from '@/env.client'

import type { Database } from './database.types'

let browserClient: SupabaseClient<Database> | undefined

/**
 * Browser client for Client Components (sign-in, dashboard interactions).
 * Loaded lazily by the few components that need it so public pages never
 * ship supabase-js.
 */
export function getSupabaseBrowserClient(): SupabaseClient<Database> {
  browserClient ??= createBrowserClient<Database>(clientEnv.supabaseUrl, clientEnv.supabaseAnonKey)
  return browserClient
}
