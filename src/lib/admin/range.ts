/**
 * Date ranges for the analytics dashboard. Days are calendar dates in the
 * reporting time zone ("YYYY-MM-DD"), matching how daily rollups are keyed.
 * Pure, so it is unit tested (tests/unit/analytics-range.test.ts).
 */

export const RANGE_PRESETS = [7, 30, 90, 365] as const

export type DateRange = {
  from: string
  to: string
  days: number
  label: string
  /** The equal-length period just before, for deltas. */
  previous: { from: string; to: string }
  preset: (typeof RANGE_PRESETS)[number] | null
}

const DAY = /^\d{4}-\d{2}-\d{2}$/
const MAX_DAYS = 400

export function addDays(day: string, amount: number): string {
  const date = new Date(`${day}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + amount)
  return date.toISOString().slice(0, 10)
}

export function daysBetween(from: string, to: string): number {
  return (
    Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000) + 1
  )
}

/** Today's date in a time zone, e.g. todayIn('Asia/Kolkata') → "2026-09-23". */
export function todayIn(timeZone: string, now: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now)
  } catch {
    return now.toISOString().slice(0, 10)
  }
}

// A real calendar date: "2026-02-30" parses (it rolls over), so round-trip it.
const valid = (day: string | undefined): day is string => {
  if (!day || !DAY.test(day)) return false
  const time = Date.parse(`${day}T00:00:00Z`)
  return !Number.isNaN(time) && new Date(time).toISOString().slice(0, 10) === day
}

/**
 * Resolves query parameters into a range: a preset ("range=30") or a custom
 * "from"/"to" pair. Custom ranges are clamped to today and to 400 days;
 * anything invalid falls back to the last 30 days.
 */
export function resolveRange(
  input: { range?: string; from?: string; to?: string },
  today: string,
): DateRange {
  let from: string
  let to: string
  let preset: DateRange['preset'] = null

  if (valid(input.from) && valid(input.to) && input.from <= input.to) {
    to = input.to > today ? today : input.to
    from = input.from > to ? to : input.from
    if (daysBetween(from, to) > MAX_DAYS) from = addDays(to, -(MAX_DAYS - 1))
  } else {
    const requested = Number(input.range)
    preset = (RANGE_PRESETS as readonly number[]).includes(requested)
      ? (requested as DateRange['preset'])
      : 30
    to = today
    from = addDays(today, -((preset ?? 30) - 1))
  }

  const days = daysBetween(from, to)
  return {
    from,
    to,
    days,
    preset,
    label: preset ? `Last ${preset} days` : `${from} to ${to}`,
    previous: { from: addDays(from, -days), to: addDays(from, -1) },
  }
}

/** Relative change from `previous` to `current`, or null when there is no base. */
export function percentChange(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) return null
  return (current - previous) / previous
}
