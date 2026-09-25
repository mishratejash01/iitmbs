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
