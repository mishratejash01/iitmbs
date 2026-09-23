import { NextResponse, type NextRequest } from 'next/server'

import { recordServerEvents } from '@/lib/analytics/server'
import { DISPLAY_COOKIE } from '@/lib/auth/display-cookie'
import { getSessionUser } from '@/lib/auth/session'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/** POST-only sign-out (a GET link could be triggered by prefetching). */
export async function POST(request: NextRequest) {
  const user = await getSessionUser()
  if (user)
    await recordServerEvents([{ name: 'logout', path: '/auth/signout' }], { userId: user.id })
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  const response = NextResponse.redirect(new URL('/', request.url), 303)
  response.cookies.delete(DISPLAY_COOKIE)
  response.headers.set('Cache-Control', 'private, no-store')
  return response
}
