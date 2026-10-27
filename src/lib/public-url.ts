import 'server-only'

import { env } from '@/env'

/**
 * The requested URL on the site's public origin. Behind a reverse proxy (the
 * VPS runs `next start` on 127.0.0.1:3300 behind Caddy) a route handler's
 * request.url holds the app server's own address, so redirects and origin
 * checks built from it would point at localhost.
 */
export function publicUrl(request: Request): URL {
  const { pathname, search } = new URL(request.url)
  return new URL(pathname + search, env.siteUrl)
}
