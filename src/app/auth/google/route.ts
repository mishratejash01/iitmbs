import type { NextRequest } from 'next/server'

import { completeSignIn, signInFailed } from '@/lib/auth/complete-sign-in'
import { safeNextPath } from '@/lib/auth/safe-next'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * Receives the ID token from Google's sign-in button on /login (posted as a
 * form), trades it for a Supabase session and completes the sign-in. Answers
 * with 303 so the browser follows with a GET.
 */
export async function POST(request: NextRequest) {
  const url = request.nextUrl
  const form = await request.formData().catch(() => null)
  const field = (name: string) => {
    const value = form?.get(name)
    return typeof value === 'string' && value !== '' ? value : null
  }
  const credential = field('credential')
  const nonce = field('nonce')
  const next = safeNextPath(field('next'))

  // Only this site's login page may post here, so another site cannot sign a
  // visitor in to an account of its choosing.
  if (request.headers.get('origin') !== url.origin) {
    return signInFailed(url, 'cross_origin', 'callback', 303)
  }
  if (!credential || !nonce) return signInFailed(url, 'missing_credential', 'callback', 303)

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: credential,
    nonce,
  })
  if (error || !data.user) return signInFailed(url, error?.message ?? 'no_user', 'callback', 303)

  return completeSignIn(supabase, data.user, next, url, 303)
}
