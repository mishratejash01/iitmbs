/** Axis ticks, number formats and day labels shared by the admin charts. */

export type ValueFormat = 'count' | 'percent' | 'seconds'

/** 3–5 clean ticks from 0 to a round maximum (0 / 25 / 50 / 75 / 100 …). */
export function niceTicks(max: number, target = 4): number[] {
  if (!Number.isFinite(max) || max <= 0) return [0, 1]
  const rough = max / target
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const step =
    [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rough) ?? 10 * magnitude
  const top = Math.ceil(max / step) * step
  const ticks: number[] = []
  for (let v = 0; v <= top + step / 2; v += step) ticks.push(Math.round(v * 1e6) / 1e6)
  return ticks
}

const compact = new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 })
const whole = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })

export function formatValue(value: number, format: ValueFormat = 'count', short = false): string {
  if (format === 'percent') return `${(value * 100).toFixed(value < 0.1 ? 1 : 0)}%`
  if (format === 'seconds') {
    if (value < 60) return `${Math.round(value)}s`
    const minutes = Math.floor(value / 60)
    return `${minutes}m ${Math.round(value % 60)}s`
  }
  return short && Math.abs(value) >= 10_000 ? compact.format(value) : whole.format(value)
}

const dayShort = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
})
const dayLong = new Intl.DateTimeFormat('en-IN', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

/** "2026-09-23" → "23 Sept" (or "Wed, 23 Sept 2026" with long). */
export function formatAxisDay(day: string, long = false): string {
  const date = new Date(`${day}T00:00:00Z`)
  return (long ? dayLong : dayShort).format(date)
}
