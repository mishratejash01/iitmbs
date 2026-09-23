import 'server-only'

import { adminDb } from './records'
import type { DateRange } from './range'

/**
 * Loaders for the admin analytics dashboard. Everything reads the daily
 * rollups through admin-only RPCs (private.assert_admin), so raw events never
 * leave the database.
 */

export type Totals = {
  visitors: number
  sessions: number
  page_views: number
  new_visitors: number
  returning_visitors: number
  logins: number
  login_failures: number
  signups: number
  downloads: number
  searches: number
  feedback: number
  dau: number | null
  wau: number | null
  mau: number | null
}

export type SeriesPoint = { day: string; value: number }
export type TopRow = { dimension: string; value: number }

export const TREND_METRICS = [
  { metric: 'site.visitors', label: 'Visitors' },
  { metric: 'site.page_views', label: 'Page views' },
  { metric: 'site.logins', label: 'Sign-ins' },
  { metric: 'site.downloads', label: 'Downloads' },
] as const

export const FUNNEL_STEPS = [
  { metric: 'funnel.reach.1_sessions', label: 'Visited the site' },
  { metric: 'funnel.reach.2_ga_view', label: 'Opened a graded assignment' },
  { metric: 'funnel.reach.3_hint_reveal', label: 'Revealed a hint' },
  { metric: 'funnel.reach.4_solution_view', label: 'Viewed a solution' },
  { metric: 'funnel.reach.5_download', label: 'Downloaded a resource' },
  { metric: 'funnel.reach.6_login', label: 'Signed in' },
] as const

const num = (value: unknown) => (typeof value === 'number' ? value : Number(value ?? 0) || 0)
const numOrNull = (value: unknown) => (value === null || value === undefined ? null : num(value))

export async function getTotals(from: string, to: string): Promise<Totals> {
  const db = await adminDb()
  const { data, error } = await db.rpc('admin_overview_totals', { p_from: from, p_to: to })
  if (error) throw new Error(error.message)
  const t = (data ?? {}) as Record<string, unknown>
  return {
    visitors: num(t.visitors),
    sessions: num(t.sessions),
    page_views: num(t.page_views),
    new_visitors: num(t.new_visitors),
    returning_visitors: num(t.returning_visitors),
    logins: num(t.logins),
    login_failures: num(t.login_failures),
    signups: num(t.signups),
    downloads: num(t.downloads),
    searches: num(t.searches),
    feedback: num(t.feedback),
    dau: numOrNull(t.dau),
    wau: numOrNull(t.wau),
    mau: numOrNull(t.mau),
  }
}

export async function getSeries(
  metric: string,
  range: Pick<DateRange, 'from' | 'to'>,
): Promise<SeriesPoint[]> {
  const db = await adminDb()
  const { data, error } = await db.rpc('admin_metric_series', {
    p_metric: metric,
    p_from: range.from,
    p_to: range.to,
  })
  if (error) throw new Error(error.message)
  return ((data ?? []) as Array<{ day: string; value: unknown }>).map((row) => ({
    day: row.day,
    value: num(row.value),
  }))
}

export async function getTop(
  metric: string,
  range: Pick<DateRange, 'from' | 'to'>,
  limit = 10,
): Promise<TopRow[]> {
  const db = await adminDb()
  const { data, error } = await db.rpc('admin_metric_top', {
    p_metric: metric,
    p_from: range.from,
    p_to: range.to,
    p_limit: limit,
  })
  if (error) throw new Error(error.message)
  return ((data ?? []) as Array<{ dimension: string; value: unknown }>).map((row) => ({
    dimension: row.dimension,
    value: num(row.value),
  }))
}

export async function getFunnel(range: Pick<DateRange, 'from' | 'to'>) {
  const series = await Promise.all(FUNNEL_STEPS.map((step) => getSeries(step.metric, range)))
  return FUNNEL_STEPS.map((step, index) => ({
    label: step.label,
    value: series[index]!.reduce((sum, point) => sum + point.value, 0),
  }))
}

export type ContentRow = {
  path: string
  page_type: string | null
  title: string | null
  views: number
  visitors: number
  avg_engaged_seconds: number
  scroll_completion: number
  bounce_rate: number
  helpful_yes: number
  helpful_no: number
  downloads: number
}

export async function getContentPerformance(
  range: Pick<DateRange, 'from' | 'to'>,
  limit = 50,
): Promise<ContentRow[]> {
  const db = await adminDb()
  const { data, error } = await db.rpc('admin_content_performance', {
    p_from: range.from,
    p_to: range.to,
    p_limit: limit,
  })
  if (error) throw new Error(error.message)
  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    path: String(row.path),
    page_type: (row.page_type as string | null) ?? null,
    title: (row.title as string | null) ?? null,
    views: num(row.views),
    visitors: num(row.visitors),
    avg_engaged_seconds: num(row.avg_engaged_seconds),
    scroll_completion: num(row.scroll_completion),
    bounce_rate: num(row.bounce_rate),
    helpful_yes: num(row.helpful_yes),
    helpful_no: num(row.helpful_no),
    downloads: num(row.downloads),
  }))
}

export type Mover = {
  path: string
  current: number
  previous: number
  change: number
  changePct: number | null
}

export async function getMovers(days = 7, limit = 10): Promise<Mover[]> {
  const db = await adminDb()
  const { data, error } = await db.rpc('admin_movers', { p_days: days, p_limit: limit })
  if (error) throw new Error(error.message)
  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    path: String(row.path),
    current: num(row.current_views),
    previous: num(row.previous_views),
    change: num(row.change),
    changePct: numOrNull(row.change_pct),
  }))
}

export type VitalsRow = {
  page_type: string
  samples: number
  lcp: number | null
  cls: number | null
  inp: number | null
  ttfb: number | null
  fcp: number | null
}

export async function getWebVitals(range: Pick<DateRange, 'from' | 'to'>): Promise<VitalsRow[]> {
  const db = await adminDb()
  const { data, error } = await db.rpc('admin_web_vitals', { p_from: range.from, p_to: range.to })
  if (error) throw new Error(error.message)
  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    page_type: String(row.page_type ?? 'other'),
    samples: num(row.samples),
    lcp: numOrNull(row.lcp_p75),
    cls: numOrNull(row.cls_p75),
    inp: numOrNull(row.inp_p75),
    ttfb: numOrNull(row.ttfb_p75),
    fcp: numOrNull(row.fcp_p75),
  }))
}

/** Titles for resource ids (download rollups are keyed by resource id). */
export async function getResourceTitles(ids: string[]): Promise<Map<string, string>> {
  const valid = ids.filter((id) => /^[0-9a-f-]{36}$/i.test(id))
  if (valid.length === 0) return new Map()
  const db = await adminDb()
  const { data } = await db.from('resources').select('id, title').in('id', valid)
  return new Map(((data ?? []) as Array<{ id: string; title: string }>).map((r) => [r.id, r.title]))
}

/** Core Web Vitals thresholds (p75): good up to the first, poor from the second. */
export const VITAL_THRESHOLDS = {
  lcp: { good: 2500, poor: 4000, unit: 'ms', label: 'LCP' },
  inp: { good: 200, poor: 500, unit: 'ms', label: 'INP' },
  cls: { good: 0.1, poor: 0.25, unit: '', label: 'CLS' },
  fcp: { good: 1800, poor: 3000, unit: 'ms', label: 'FCP' },
  ttfb: { good: 800, poor: 1800, unit: 'ms', label: 'TTFB' },
} as const

export type VitalName = keyof typeof VITAL_THRESHOLDS

export function vitalRating(
  name: VitalName,
  value: number | null,
): 'good' | 'needs-improvement' | 'poor' | null {
  if (value === null) return null
  const t = VITAL_THRESHOLDS[name]
  return value <= t.good ? 'good' : value <= t.poor ? 'needs-improvement' : 'poor'
}
