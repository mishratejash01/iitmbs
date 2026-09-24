import 'server-only'

import type { SupabaseClient, User } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

import { recordServerEvents } from '@/lib/analytics/server'
import { DISPLAY_COOKIE, encodeDisplayUser } from '@/lib/auth/display-cookie'
import type { Database } from '@/lib/supabase/database.types'

/**
 * Records a failed Google sign-in and sends the visitor back to /login with a
 * message. `status` is 303 when answering a POST, so the browser follows with
 * a GET.
 */
export async function signInFailed(
  requestUrl: URL,
  reason: string,
  error: 'callback' | 'denied' = 'callback',
  status = 307,
): Promise<NextResponse> {
  await recordServerEvents([
    { name: 'login_failure', path: requestUrl.pathname, props: { provider: 'google', reason } },
  ])
  return NextResponse.redirect(new URL(`/login?error=${error}`, requestUrl), status)
}

/**
 * Runs once Supabase has a session for the user: makes sure the profile
 * exists, sets the display cookie, records login_success /
 * signup_first_login and routes first-time users to onboarding.
 */
export async function completeSignIn(
  supabase: SupabaseClient<Database>,
  user: User,
  next: string,
  requestUrl: URL,
  status = 307,
): Promise<NextResponse> {
  const meta = user.user_metadata ?? {}
  // The signup trigger normally creates the profile; this is a safety net.
  const { data: existing } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()
  let profile = existing
  if (!profile) {
    const { data: created } = await supabase
      .from('profiles')
      .upsert({ id: user.id, email: user.email ?? null }, { onConflict: 'id' })
      .select('*')
      .maybeSingle()
    profile = created
  }
  await supabase
    .from('profiles')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', user.id)

  const path = requestUrl.pathname
  const firstLogin =
    !profile?.onboarding_completed && Date.now() - Date.parse(user.created_at) < 10 * 60 * 1000
  await recordServerEvents(
    [
      { name: 'login_success', path, props: { provider: 'google' } },
      ...(firstLogin ? [{ name: 'signup_first_login', path, props: { provider: 'google' } }] : []),
    ],
    { userId: user.id },
  )

  const destination = profile?.onboarding_completed
    ? next
    : `/onboarding?next=${encodeURIComponent(next)}`
  const response = NextResponse.redirect(new URL(destination, requestUrl), status)
  response.cookies.set(
    DISPLAY_COOKIE,
    encodeDisplayUser({
      name:
        profile?.full_name ||
        (typeof meta.full_name === 'string' ? meta.full_name : null) ||
        user.email?.split('@')[0] ||
        'Student',
      avatar: profile?.avatar_url ?? (typeof meta.avatar_url === 'string' ? meta.avatar_url : null),
      staff: profile?.role === 'editor' || profile?.role === 'admin',
    }),
    {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      secure: requestUrl.protocol === 'https:',
      maxAge: 60 * 60 * 24 * 30,
    },
  )
  response.headers.set('Cache-Control', 'private, no-store')
  return response
}
