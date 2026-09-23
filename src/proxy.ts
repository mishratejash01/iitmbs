import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Runs only where it is needed (see `config.matcher`), so statically cached
 * content pages are served straight from the CDN without invoking it:
 *
 * 1. Lower-case URLs: /Data-Science/Maths-1 → 308 → /data-science/maths-1.
 * 2. Signed-in areas: refreshes the Supabase session cookie before rendering,
 *    redirects signed-out visitors to /login (a real 307) and clears the
 *    display cookie once the session is gone.
 *
 * Database redirects and alias slugs are resolved by the pages themselves
 * (src/lib/data/redirects.ts), also as real permanent redirects.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (/[A-Z]/.test(pathname) && !pathname.startsWith('/api/') && !pathname.startsWith('/_next/')) {
    const url = request.nextUrl.clone()
    url.pathname = pathname.toLowerCase()
    url.search = search
    return NextResponse.redirect(url, 308)
  }

  let response = NextResponse.next({ request })
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) return response

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value)
        response = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options)
        // Never let a CDN cache a response that sets auth cookies.
        for (const [key, value] of Object.entries(headers)) response.headers.set(key, value)
      },
    },
  })

  // Do not run code between createServerClient and getClaims: the call
  // refreshes the session and must see the current cookies.
  const { data } = await supabase.auth.getClaims()
  const signedIn = Boolean(data?.claims?.sub)

  // Signed-in areas: send visitors to /login with a real HTTP redirect
  // (pages stream, so a redirect from inside them could not set a status).
  if (!signedIn && /^\/(dashboard|admin|onboarding)(\/|$)/.test(pathname)) {
    const login = request.nextUrl.clone()
    login.pathname = '/login'
    login.search = `?next=${encodeURIComponent(pathname + search)}`
    const redirect = NextResponse.redirect(login, 307)
    if (request.cookies.has('qh_user')) redirect.cookies.delete('qh_user')
    return redirect
  }
  if (signedIn && pathname === '/login') {
    const next = request.nextUrl.searchParams.get('next')
    const target = request.nextUrl.clone()
    target.pathname = next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'
    target.search = ''
    return NextResponse.redirect(target, 307)
  }

  if (!signedIn && request.cookies.has('qh_user')) {
    response.cookies.delete('qh_user')
  }
  return response
}

export const config = {
  matcher: [
    // Any page URL containing an upper-case letter.
    '/((?!_next/|api/|.*\\..*)(?=.*[A-Z]).*)',
    // Signed-in areas and account APIs (session refresh).
    '/dashboard/:path*',
    '/admin/:path*',
    '/onboarding',
    '/login',
    '/api/me/:path*',
    '/api/admin/:path*',
  ],
}
