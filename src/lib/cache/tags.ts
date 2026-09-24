/**
 * Cache tags. Every cached data function tags its result with the tables it
 * reads; a write to a table (admin publish, database webhook, scheduled
 * go-live) revalidates that table's tag. Coarse by design: content volume is
 * small, revalidation is stale-while-revalidate, and it is impossible to
 * forget a dependency.
 */

export const CONTENT_TABLES = [
  'programs',
  'courses',
  'course_programs',
  'weeks',
  'assignments',
  'questions',
  'notes',
  'resources',
  'faqs',
  'pages',
  'blog_categories',
  'blog_posts',
  'note_courses',
  'question_papers',
  'lecture_videos',
  'authors',
  'media',
  'site_settings',
  'nav_items',
  'footer_links',
  'redirects',
  'seo_overrides',
] as const

export type ContentTable = (typeof CONTENT_TABLES)[number]

export const tableTag = (table: ContentTable) => `t:${table}`

/** Tags to revalidate when a table changes (some writes affect other reads). */
export function tagsForTableChange(table: ContentTable): string[] {
  const tags = new Set<string>([tableTag(table)])
  // Question edits bump their assignment (see bump_parent_assignment), and a
  // released walkthrough changes what assignment pages render.
  if (table === 'questions') tags.add(tableTag('assignments'))
  if (table === 'assignments') tags.add(tableTag('questions'))
  // Anything routing-related changes the search index and sitemaps.
  tags.add('search')
  tags.add('sitemap')
  return [...tags]
}

export function isContentTable(value: string): value is ContentTable {
  return (CONTENT_TABLES as readonly string[]).includes(value)
}
