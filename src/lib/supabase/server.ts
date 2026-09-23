import 'server-only'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import { env } from '@/env'

import type { Database } from './database.types'

/**
 * Session-aware client for Server Components, Server Actions and Route
 * Handlers. Reads the auth cookies of the current request, so anything using
 * it renders dynamically — keep it out of the public, statically generated
 * pages.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // Called from a Server Component, where cookies are read-only. The
          // proxy refreshes sessions on the next request, so this is safe.
        }
      },
    },
  })
}
