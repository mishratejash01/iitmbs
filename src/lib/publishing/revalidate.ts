import 'server-only'

import { revalidateTag } from 'next/cache'

import { isContentTable, tagsForTableChange, type ContentTable } from '@/lib/cache/tags'

/**
 * Invalidates cached data for changed tables. `immediate` expires entries so
 * the very next request renders fresh content — used when correctness beats
 * speed (a scheduled release, an unpublish). Otherwise stale content is
 * served while the page regenerates in the background.
 */
export function revalidateTables(tables: string[], options: { immediate?: boolean } = {}): string[] {
  const tags = new Set<string>()
  for (const table of tables) {
    if (isContentTable(table)) for (const tag of tagsForTableChange(table as ContentTable)) tags.add(tag)
  }
  for (const tag of tags) revalidateTag(tag, options.immediate ? { expire: 0 } : 'max')
  return [...tags]
}
