import { env } from '@/env'

/** IndexNow ownership proof (referenced as keyLocation in pings). */
export function GET() {
  if (!env.indexNowKey) return new Response('Not found', { status: 404 })
  return new Response(env.indexNowKey, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
