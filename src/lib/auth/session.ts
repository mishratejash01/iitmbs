import 'server-only'

import { notFound, redirect } from 'next/navigation'
import { cache } from 'react'

import type { Database } from '@/lib/supabase/database.types'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export type SessionUser = { id: string; email: string | null }
export type Profile = Database['public']['Tables']['profiles']['Row']

/**
 * The signed-in user for this request, verified from the JWT (getClaims
 * validates the signature). Deduplicated per request with React cache().
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.getClaims()
  const sub = data?.claims?.sub
  if (error || !sub) return null
  const email = typeof data.claims.email === 'string' ? data.claims.email : null
  return { id: sub, email }
})

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const user = await getSessionUser()
  if (!user) return null
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  if (error) console.error('[auth] profile lookup failed:', error.message)
  return data
})

/** Redirects to /login (returning to `nextPath` afterwards) when signed out. */
export async function requireUser(nextPath: string): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`)
  return user
}

/** Editors and admins only; everyone else gets a 404 (the area is not advertised). */
export async function requireStaff(nextPath = '/admin'): Promise<Profile> {
  await requireUser(nextPath)
  const profile = await getCurrentProfile()
  if (!profile || (profile.role !== 'editor' && profile.role !== 'admin')) notFound()
  return profile
}

export async function requireAdmin(nextPath = '/admin'): Promise<Profile> {
  const profile = await requireStaff(nextPath)
  if (profile.role !== 'admin') notFound()
  return profile
}
