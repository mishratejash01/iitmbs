/** Longer titles are cut off in results; Bing flags anything over 70 characters. */
export const TITLE_LIMIT = 70

/**
 * Keeps a title within TITLE_LIMIT: first by dropping the " | Site name"
 * suffix, then by taking the first shorter title that fits (with the suffix
 * when there is room). A title that cannot be shortened is returned as is.
 */
export function fitTitle(title: string, siteName: string, shortTitles: string[] = []): string {
  if (title.length <= TITLE_LIMIT) return title
  const suffix = ` | ${siteName}`
  const bare = title.endsWith(suffix) ? title.slice(0, -suffix.length) : title
  if (bare.length <= TITLE_LIMIT) return bare
  const short = shortTitles.find((candidate) => candidate.length <= TITLE_LIMIT)
  if (!short) return bare
  return `${short}${suffix}`.length <= TITLE_LIMIT ? `${short}${suffix}` : short
}

/** Titles this short show in full on phones and desktops. */
export const PREFERRED_TITLE = 60

/**
 * The first candidate within PREFERRED_TITLE, else the first within
 * TITLE_LIMIT, else the last. Empty candidates are skipped.
 */
export function pickTitle(candidates: Array<string | null | false | undefined>): string {
  const list = candidates.filter((c): c is string => Boolean(c))
  return (
    list.find((c) => c.length <= PREFERRED_TITLE) ??
    list.find((c) => c.length <= TITLE_LIMIT) ??
    list.at(-1) ??
    ''
  )
}

/** "Statistics for Data Science II" → "Statistics for Data Science 2": students type digits. */
export function withDigits(name: string): string {
  return name
    .replace(/\bIII\b/g, '3')
    .replace(/\bII\b/g, '2')
    .replace(/\bI\b/g, '1')
}

/** Terms like "2021-sep" → "2021 to 2025" (or one year). Null when there are none. */
export function yearRange(terms: string[]): string | null {
  const years = terms.map((term) => Number(term.slice(0, 4))).filter((y) => y > 2000)
  if (years.length === 0) return null
  const first = Math.min(...years)
  const last = Math.max(...years)
  return first === last ? String(first) : `${first} to ${last}`
}

/**
 * The spelled-out name students also type for courses whose short name is an
 * abbreviation ("stats 1" and "statistics 1" are both common searches).
 */
export const SEARCH_NAMES: Record<string, string> = {
  BSMA1002: 'Statistics 1',
  BSMA1004: 'Statistics 2',
  BSCS1001: 'Computational Thinking',
  BSMA1001: 'Mathematics 1',
  BSMA1003: 'Mathematics 2',
}
