import { NextResponse, type NextRequest } from 'next/server'

import { recordServerEvents } from '@/lib/analytics/server'
import { DISPLAY_COOKIE, encodeDisplayUser } from '@/lib/auth/display-cookie'
import { safeNextPath } from '@/lib/auth/safe-next'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * OAuth (PKCE) callback: exchanges the code for a session, makes sure the
 * profile exists, sets the display cookie and routes first-time users to
 * onboarding. Records login_success / signup_first_login / login_failure.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl
  const next = safeNextPath(url.searchParams.get('next'))
  const code = url.searchParams.get('code')
  const oauthError = url.searchParams.get('error')

  if (!code) {
    await recordServerEvents([
      { name: 'login_failure', path: '/auth/callback', props: { provider: 'google', reason: oauthError ?? 'missing_code' } },
    ])
    return NextResponse.redirect(new URL(`/login?error=${oauthError === 'access_denied' ? 'denied' : 'callback'}`, url))
  }

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error || !data.user) {
    await recordServerEvents([
      { name: 'login_failure', path: '/auth/callback', props: { provider: 'google', reason: error?.message ?? 'no_user' } },
    ])
    return NextResponse.redirect(new URL('/login?error=callback', url))
  }

  const user = data.user
  const meta = user.user_metadata ?? {}
  // The signup trigger normally creates the profile; this is a safety net.
  const { data: existing } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  let profile = existing
  if (!profile) {
    const { data: created } = await supabase
      .from('profiles')
      .upsert({ id: user.id, email: user.email ?? null }, { onConflict: 'id' })
      .select('*')
      .maybeSingle()
    profile = created
  }
  await supabase.from('profiles').update({ last_seen_at: new Date().toISOString() }).eq('id', user.id)

  const firstLogin = !profile?.onboarding_completed && Date.now() - Date.parse(user.created_at) < 10 * 60 * 1000
  await recordServerEvents(
    [
      { name: 'login_success', path: '/auth/callback', props: { provider: 'google' } },
      ...(firstLogin ? [{ name: 'signup_first_login', path: '/auth/callback', props: { provider: 'google' } }] : []),
    ],
    { userId: user.id },
  )

  const destination = profile?.onboarding_completed ? next : `/onboarding?next=${encodeURIComponent(next)}`
  const response = NextResponse.redirect(new URL(destination, url))
  response.cookies.set(
    DISPLAY_COOKIE,
    encodeDisplayUser({
      name: profile?.full_name || (typeof meta.full_name === 'string' ? meta.full_name : null) || user.email?.split('@')[0] || 'Student',
      avatar: profile?.avatar_url ?? (typeof meta.avatar_url === 'string' ? meta.avatar_url : null),
      staff: profile?.role === 'editor' || profile?.role === 'admin',
    }),
    { path: '/', httpOnly: false, sameSite: 'lax', secure: url.protocol === 'https:', maxAge: 60 * 60 * 24 * 30 },
  )
  response.headers.set('Cache-Control', 'private, no-store')
  return response
}
