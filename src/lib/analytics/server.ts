import 'server-only'

import { cookies, headers } from 'next/headers'

import { env } from '@/env'
import { getSessionUser } from '@/lib/auth/session'
import type { Json } from '@/lib/supabase/database.types'
import { getServiceClient } from '@/lib/supabase/admin'

import { ANALYTICS_COOKIES } from './events'
import {
  clientIp,
  geoFromHeaders,
  hashIp,
  isBotRequest,
  parseUserAgent,
  referrerHost,
  trafficSource,
} from './request'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export type AnalyticsContext = {
  anonymousId: string
  sessionId: string
  consent: 'essential' | 'detailed'
  userId: string | null
  isBot: boolean
  ingest: { [key: string]: Json | undefined }
}

/**
 * Resolves who/where a request comes from for analytics. The user id is only
 * attached with detailed consent (DPDP): essential analytics stay
 * pseudonymous. Global Privacy Control forces essential.
 */
export async function getAnalyticsContext(
  input: {
    anonymousId?: string | null
    sessionId?: string | null
    consent?: string | null
    referrer?: string | null
    landingPath?: string | null
    screen?: string | null
    utm?: Partial<Record<'source' | 'medium' | 'campaign' | 'term' | 'content', string>>
  } = {},
): Promise<AnalyticsContext | null> {
  const [headerList, cookieStore] = await Promise.all([headers(), cookies()])
  const ua = headerList.get('user-agent') ?? ''

  const anonymousId =
    input.anonymousId ?? cookieStore.get(ANALYTICS_COOKIES.anonymousId)?.value ?? null
  const sessionId = input.sessionId ?? cookieStore.get(ANALYTICS_COOKIES.sessionId)?.value ?? null
  if (!anonymousId || !sessionId || !UUID.test(anonymousId) || !UUID.test(sessionId)) return null

  const gpc = headerList.get('sec-gpc') === '1'
  const requested = input.consent ?? cookieStore.get(ANALYTICS_COOKIES.consent)?.value
  const consent: 'essential' | 'detailed' =
    !gpc && requested === 'detailed' ? 'detailed' : 'essential'
  const user = consent === 'detailed' ? await getSessionUser() : null

  const { device, browser, os } = parseUserAgent(ua)
  const geo = geoFromHeaders(headerList)
  const siteHost = new URL(env.siteUrl).hostname.replace(/^www\./, '')

  return {
    anonymousId,
    sessionId,
    consent,
    userId: user?.id ?? null,
    isBot: isBotRequest(ua),
    ingest: {
      session_id: sessionId,
      anonymous_id: anonymousId,
      user_id: user?.id ?? null,
      consent_level: consent,
      device_type: device,
      browser,
      os,
      screen: input.screen?.slice(0, 20) ?? null,
      country: geo.country,
      region: geo.region,
      city: geo.city,
      ip_hash: hashIp(clientIp(headerList)),
      landing_path: input.landingPath?.slice(0, 500) ?? null,
      referrer: input.referrer?.slice(0, 500) ?? null,
      referrer_host: referrerHost(input.referrer),
      traffic_source: trafficSource({
        referrer: input.referrer,
        utmSource: input.utm?.source,
        userAgent: ua,
        siteHost,
      }),
      utm_source: input.utm?.source ?? null,
      utm_medium: input.utm?.medium ?? null,
      utm_campaign: input.utm?.campaign ?? null,
      utm_term: input.utm?.term ?? null,
      utm_content: input.utm?.content ?? null,
    },
  }
}

/** Server-side search logging. Returns the search id for click attribution. */
export async function recordSearch(input: {
  /** Pre-generated id returned to the client for click attribution. */
  id?: string
  query: string
  normalized: string
  resultsCount: number
  source: 'page' | 'dialog' | 'api'
  parsed: { [key: string]: Json | undefined }
  /**
   * The request's analytics context. Server Components must read it before
   * `after()` (request headers are unavailable inside it while rendering).
   */
  context?: AnalyticsContext | null
}): Promise<string | null> {
  const db = getServiceClient()
  if (!db) return null
  const context = input.context !== undefined ? input.context : await getAnalyticsContext()
  if (context?.isBot) return null

  const { data, error } = await db
    .from('searches')
    .insert({
      ...(input.id ? { id: input.id } : {}),
      query: input.query.slice(0, 200),
      normalized_query: input.normalized.slice(0, 200),
      results_count: input.resultsCount,
      source: input.source,
      parsed: input.parsed,
      user_id: context?.userId ?? null,
      anonymous_id: context?.anonymousId ?? null,
      session_id: context?.sessionId ?? null,
    })
    .select('id')
    .single()
  if (error) {
    console.error('[analytics] search log failed:', error.message)
    return null
  }
  return data.id
}

/** Records auth funnel events from server code (e.g. the OAuth callback). */
export async function recordServerEvents(
  events: Array<{ name: string; path?: string; props?: { [key: string]: Json | undefined } }>,
  overrides: { userId?: string | null } = {},
) {
  const db = getServiceClient()
  if (!db) return
  const context = await getAnalyticsContext()
  if (!context || context.isBot) return
  const ingest = { ...context.ingest }
  if (overrides.userId !== undefined) ingest.user_id = overrides.userId
  const { error } = await db.rpc('ingest_events', {
    p_context: ingest,
    p_events: events.map((event) => ({
      name: event.name,
      path: event.path ?? null,
      props: event.props ?? {},
    })),
  })
  if (error) console.error('[analytics] server events failed:', error.message)
}
