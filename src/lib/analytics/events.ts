/**
 * Client-sendable analytics events. The authoritative catalogue (with
 * descriptions and storage rules) is the event_definitions table; the API
 * rejects anything not active there. Server-only events (download_complete,
 * search_query, search_zero_results) are recorded by the server itself.
 */
export const CLIENT_EVENTS = [
  'session_start',
  'session_end',
  'tab_visibility_change',
  'page_view',
  'internal_link_click',
  'outbound_link_click',
  'breadcrumb_click',
  'nav_click',
  'scroll_depth',
  'time_on_page',
  'toc_click',
  'hint_reveal',
  'solution_view',
  'solution_gate_seen',
  'copy_text',
  'code_copy',
  'formula_sheet_open',
  'download_click',
  'search_result_click',
  'login_click',
  'login_success',
  'login_failure',
  'logout',
  'signup_first_login',
  'onboarding_complete',
  'bookmark_add',
  'bookmark_remove',
  'progress_toggle',
  'feedback_helpful',
  'share_click',
  'theme_toggle',
  'consent_update',
  'js_error',
  'api_error',
  '404_hit',
  'web_vital',
] as const

export type ClientEventName = (typeof CLIENT_EVENTS)[number]

export type EventProps = Record<string, string | number | boolean | null | undefined>

export type TrackPayloadEvent = {
  name: ClientEventName
  path: string
  page_view_id?: string
  page_type?: string
  entity_id?: string
  title?: string
  referrer?: string
  props?: EventProps
}

export type TrackPayload = {
  anonymous_id: string
  session_id: string
  consent: 'essential' | 'detailed'
  screen?: string
  landing_path?: string
  referrer?: string
  utm?: Partial<Record<'source' | 'medium' | 'campaign' | 'term' | 'content', string>>
  events: TrackPayloadEvent[]
}

export const ANALYTICS_COOKIES = {
  anonymousId: 'qh_aid',
  sessionId: 'qh_sid',
  consent: 'qh_consent',
} as const

export const SESSION_TIMEOUT_MINUTES = 30
