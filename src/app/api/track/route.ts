import { env } from '@/env'
import { allowRequest } from '@/lib/analytics/rate-limit'
import { clientIp, hashIp } from '@/lib/analytics/request'
import { trackPayloadSchema } from '@/lib/analytics/schema'
import { getAnalyticsContext } from '@/lib/analytics/server'
import { getActiveEventNames } from '@/lib/data/event-definitions'
import { getServiceClient } from '@/lib/supabase/admin'

const MAX_BODY_BYTES = 64 * 1024
const noContent = () => new Response(null, { status: 204 })

/**
 * First-party analytics ingest. Validates with Zod, accepts same-origin
 * requests only, drops bots, rate-limits per visitor and IP hash, keeps only
 * events active in event_definitions, then hands the batch to Postgres.
 * Always answers 204 so the client never retries or surfaces errors.
 */
export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  if (origin && origin !== new URL(env.siteUrl).origin && origin !== new URL(request.url).origin) {
    return new Response(null, { status: 403 })
  }

  const db = getServiceClient()
  if (!db) return noContent()

  const body = await request.text()
  if (body.length === 0 || body.length > MAX_BODY_BYTES) return noContent()

  let json: unknown
  try {
    json = JSON.parse(body)
  } catch {
    return new Response(null, { status: 400 })
  }
  const parsed = trackPayloadSchema.safeParse(json)
  if (!parsed.success) return new Response(null, { status: 400 })
  const payload = parsed.data

  const context = await getAnalyticsContext({
    anonymousId: payload.anonymous_id,
    sessionId: payload.session_id,
    consent: payload.consent,
    referrer: payload.referrer,
    landingPath: payload.landing_path,
    screen: payload.screen,
    utm: payload.utm,
  })
  if (!context || context.isBot) return noContent()

  const ipKey = hashIp(clientIp(request.headers)) ?? 'noip'
  const [visitorOk, ipOk] = await Promise.all([
    allowRequest(`track:a:${payload.anonymous_id}`, 60, 60),
    allowRequest(`track:i:${ipKey}`, 60, 300),
  ])
  if (!visitorOk || !ipOk) return new Response(null, { status: 429 })

  const allowed = new Set(await getActiveEventNames())
  const events = payload.events
    .filter((event) => allowed.size === 0 || allowed.has(event.name))
    .map((event) => ({
      name: event.name,
      path: event.path,
      page_view_id: event.page_view_id ?? null,
      page_type: event.page_type ?? null,
      entity_id: event.entity_id ?? null,
      title: event.title ?? null,
      referrer: event.referrer ?? null,
      props: event.props ?? {},
    }))
  if (events.length === 0) return noContent()

  const { error } = await db.rpc('ingest_events', { p_context: context.ingest, p_events: events })
  if (error) console.error('[api/track] ingest failed:', error.message)
  return noContent()
}
