/**
 * Browser analytics: a tiny, dependency-free tracker. Events are queued,
 * batched and sent to /api/track (sendBeacon on page hide). Identifiers are
 * first-party cookies; nothing is sent to third parties.
 */
import {
  ANALYTICS_COOKIES,
  SESSION_TIMEOUT_MINUTES,
  type ClientEventName,
  type EventProps,
  type TrackPayload,
  type TrackPayloadEvent,
} from './events'

type PageState = { pageViewId: string; path: string; pageType?: string; entityId?: string; title?: string }

const ENDPOINT = '/api/track'
const MAX_BATCH = 20
const FLUSH_DELAY_MS = 2500

let queue: TrackPayloadEvent[] = []
let flushTimer: ReturnType<typeof setTimeout> | undefined
let page: PageState | undefined
let landingPath: string | undefined

const isBrowser = () => typeof window !== 'undefined' && typeof document !== 'undefined'

export function readCookie(name: string): string | null {
  if (!isBrowser()) return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1] ?? '') : null
}

export function writeCookie(name: string, value: string, maxAgeSeconds: number) {
  if (!isBrowser()) return
  const secure = location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`
}

export function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  // RFC 4122 v4 fallback for older browsers.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function getConsent(): 'essential' | 'detailed' {
  if (isBrowser() && (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) {
    return 'essential'
  }
  return readCookie(ANALYTICS_COOKIES.consent) === 'detailed' ? 'detailed' : 'essential'
}

function anonymousId(): string {
  let id = readCookie(ANALYTICS_COOKIES.anonymousId)
  if (!id || !UUID.test(id)) id = uuid()
  writeCookie(ANALYTICS_COOKIES.anonymousId, id, 60 * 60 * 24 * 365)
  return id
}

/** Returns the session id, starting a new session after 30 idle minutes. */
function sessionId(): { id: string; isNew: boolean } {
  const existing = readCookie(ANALYTICS_COOKIES.sessionId)
  const id = existing && UUID.test(existing) ? existing : uuid()
  writeCookie(ANALYTICS_COOKIES.sessionId, id, SESSION_TIMEOUT_MINUTES * 60)
  return { id, isNew: id !== existing }
}

function utm(): TrackPayload['utm'] {
  try {
    const stored = sessionStorage.getItem('qh_utm')
    if (stored) return JSON.parse(stored) as TrackPayload['utm']
    const params = new URLSearchParams(location.search)
    const value: NonNullable<TrackPayload['utm']> = {}
    for (const key of ['source', 'medium', 'campaign', 'term', 'content'] as const) {
      const v = params.get(`utm_${key}`)
      if (v) value[key] = v.slice(0, 100)
    }
    sessionStorage.setItem('qh_utm', JSON.stringify(value))
    return value
  } catch {
    return {}
  }
}

function send(events: TrackPayloadEvent[], beacon: boolean) {
  const session = sessionId()
  const payload: TrackPayload = {
    anonymous_id: anonymousId(),
    session_id: session.id,
    consent: getConsent(),
    screen: `${screen.width}x${screen.height}`,
    landing_path: landingPath,
    referrer: document.referrer || undefined,
    utm: utm(),
    events,
  }
  const body = JSON.stringify(payload)
  if (beacon && navigator.sendBeacon) {
    navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }))
    return
  }
  void fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: body.length < 60_000,
    credentials: 'same-origin',
  }).catch(() => {
    // Analytics must never break the page.
  })
}

/** Sends everything queued. Use beacon=true when the page is going away. */
export function flush(beacon = false) {
  if (!isBrowser() || queue.length === 0) return
  clearTimeout(flushTimer)
  flushTimer = undefined
  while (queue.length > 0) send(queue.splice(0, MAX_BATCH), beacon)
}

/** Queue an event for the current page. */
export function track(name: ClientEventName, props?: EventProps, options: { immediate?: boolean } = {}) {
  if (!isBrowser()) return
  queue.push({
    name,
    path: page?.path ?? location.pathname,
    page_view_id: page?.pageViewId,
    page_type: page?.pageType,
    entity_id: page?.entityId,
    props,
  })
  if (options.immediate || queue.length >= MAX_BATCH) flush()
  else flushTimer ??= setTimeout(() => flush(), FLUSH_DELAY_MS)
}

/** Starts a page view; returns its id. Called by <Analytics> on navigation. */
export function startPageView(input: {
  path: string
  pageType?: string
  entityId?: string
  title?: string
  referrer?: string
  isEntry: boolean
  searchEngine?: string
  referrerHost?: string
}): string {
  const session = sessionId()
  landingPath ??= input.path
  const pageViewId = uuid()
  page = { pageViewId, path: input.path, pageType: input.pageType, entityId: input.entityId, title: input.title }
  if (session.isNew) track('session_start', { landing_path: input.path })
  queue.push({
    name: 'page_view',
    path: input.path,
    page_view_id: pageViewId,
    page_type: input.pageType,
    entity_id: input.entityId,
    title: input.title,
    referrer: input.referrer,
    props: {
      is_entry: input.isEntry,
      referrer_host: input.referrerHost,
      search_engine: input.searchEngine,
    },
  })
  flush()
  return pageViewId
}

export function currentPage(): PageState | undefined {
  return page
}
