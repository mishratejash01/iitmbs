import type { Metadata } from 'next'
import Link from 'next/link'

import { EmptyState } from '@/components/ui/empty-state'
import { getSiteSettings } from '@/lib/data/settings'
import { privateMetadata } from '@/lib/seo/metadata'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils/dates'

import { removeBookmark } from '../actions'

// Reads the session, so it renders on each request.
export const instant = false

export async function generateMetadata(): Promise<Metadata> {
  return privateMetadata('Bookmarks', await getSiteSettings())
}

export default async function BookmarksPage() {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('bookmarks')
    .select('path, title, created_at')
    .order('created_at', { ascending: false })
  const bookmarks = data ?? []

  return (
    <section aria-labelledby="bookmarks-title" className="container-reading">
      <h1 id="bookmarks-title" className="text-h2 font-semibold text-text">
        Bookmarks
      </h1>
      {bookmarks.length === 0 ? (
        <EmptyState
          className="mt-6"
          title="No bookmarks yet"
          description="Tap “Bookmark” on any course, week or notes page."
        />
      ) : (
        <ul className="mt-6 border-t border-border">
          {bookmarks.map((bookmark) => (
            <li key={bookmark.path} className="flex items-center gap-4 border-b border-border py-4">
              <Link href={bookmark.path} className="group min-w-0 flex-1">
                <span className="block font-medium text-text decoration-accent-ink/40 underline-offset-4 group-hover:text-accent-ink group-hover:underline">
                  {bookmark.title}
                </span>
                <span className="mt-0.5 block text-xs text-muted">
                  Saved {formatDate(bookmark.created_at)}
                </span>
              </Link>
              <form action={removeBookmark}>
                <input type="hidden" name="path" value={bookmark.path} />
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center px-1 text-small font-semibold text-muted underline decoration-border-strong underline-offset-4 hover:text-danger hover:decoration-danger"
                  aria-label={`Remove bookmark: ${bookmark.title}`}
                >
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
