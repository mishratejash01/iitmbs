import type { NextRequest } from 'next/server'

import { completeSignIn, signInFailed } from '@/lib/auth/complete-sign-in'
import { safeNextPath } from '@/lib/auth/safe-next'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * OAuth (PKCE) callback for the redirect flow: exchanges the code for a
 * session, then completes the sign-in (profile, display cookie, analytics,
 * onboarding).
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl
  const next = safeNextPath(url.searchParams.get('next'))
  const code = url.searchParams.get('code')
  const oauthError = url.searchParams.get('error')

  if (!code) {
    return signInFailed(
      url,
      oauthError ?? 'missing_code',
      oauthError === 'access_denied' ? 'denied' : 'callback',
    )
  }

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error || !data.user) return signInFailed(url, error?.message ?? 'no_user')

  return completeSignIn(supabase, data.user, next, url)
}
