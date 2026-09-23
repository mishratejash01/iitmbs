/** "1.4 MB" */
export function formatBytes(bytes: number | null | undefined): string | null {
  if (bytes === null || bytes === undefined || bytes <= 0) return null
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value >= 10 || unit === 0 ? Math.round(value) : value.toFixed(1)} ${units[unit]}`
}

/** "1.2k", "3.4M" */
export function formatCount(value: number): string {
  if (value < 1000) return String(value)
  if (value < 1_000_000) return `${(value / 1000).toFixed(value < 10_000 ? 1 : 0).replace(/\.0$/, '')}k`
  return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
}

/** ISO-8601 duration for schema.org, e.g. PT12M. */
export function isoDuration(minutes: number): string {
  const m = Math.max(1, Math.round(minutes))
  return m >= 60 ? `PT${Math.floor(m / 60)}H${m % 60 ? `${m % 60}M` : ''}` : `PT${m}M`
}
