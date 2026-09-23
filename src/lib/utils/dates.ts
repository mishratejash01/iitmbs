/**
 * Date formatting for display. Everything is shown in India Standard Time —
 * the programme's official time zone — with a fixed locale, so server and
 * client render identical strings (no hydration mismatch, no "flash").
 */

export const DISPLAY_TIME_ZONE = 'Asia/Kolkata'
const LOCALE = 'en-IN'

const dateFormat = new Intl.DateTimeFormat(LOCALE, {
  timeZone: DISPLAY_TIME_ZONE,
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const dateTimeFormat = new Intl.DateTimeFormat(LOCALE, {
  timeZone: DISPLAY_TIME_ZONE,
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
})

/** "2 Oct 2026" */
export function formatDate(iso: string | Date): string {
  return dateFormat.format(typeof iso === 'string' ? new Date(iso) : iso)
}

/** "Fri, 2 Oct 2026, 11:59 pm IST" */
export function formatDateTime(iso: string | Date): string {
  return `${dateTimeFormat.format(typeof iso === 'string' ? new Date(iso) : iso)} IST`
}

/** Calendar year in IST, e.g. for "{year}" in titles. */
export function yearInIst(iso: string | Date = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: DISPLAY_TIME_ZONE,
    year: 'numeric',
  }).formatToParts(typeof iso === 'string' ? new Date(iso) : iso)
  return Number(parts.find((p) => p.type === 'year')?.value ?? new Date().getUTCFullYear())
}

/** Human duration for countdowns: "3 days 4 hours", "2 hours 5 minutes", "40 seconds". */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const days = Math.floor(s / 86400)
  const hours = Math.floor((s % 86400) / 3600)
  const minutes = Math.floor((s % 3600) / 60)
  const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'}`
  if (days > 0)
    return hours > 0 ? `${plural(days, 'day')} ${plural(hours, 'hour')}` : plural(days, 'day')
  if (hours > 0)
    return minutes > 0
      ? `${plural(hours, 'hour')} ${plural(minutes, 'minute')}`
      : plural(hours, 'hour')
  if (minutes > 0) return plural(minutes, 'minute')
  return plural(s, 'second')
}

/** The moment `days` days before now (for "last 30 days" style ranges). */
export function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 86_400_000)
}
