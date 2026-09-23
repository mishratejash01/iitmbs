/**
 * With Cache Components, generateStaticParams must return at least one entry.
 * When the database has nothing to prerender yet (fresh install, or no live
 * content of a kind), a placeholder keeps the build valid; it renders the 404
 * page and is never linked or listed in a sitemap.
 */
export const PLACEHOLDER_SEGMENT = '__placeholder__'

export function withPlaceholder<T extends Record<string, string>>(params: T[], placeholder: T): T[] {
  return params.length > 0 ? params : [placeholder]
}
