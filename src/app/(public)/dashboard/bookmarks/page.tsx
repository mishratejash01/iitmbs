import { Trash2 } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { EmptyState } from '@/components/ui/empty-state'
import { getSiteSettings } from '@/lib/data/settings'
import { privateMetadata } from '@/lib/seo/metadata'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils/dates'

import { removeBookmark } from '../actions'

export async function generateMetadata(): Promise<Metadata> {
  return privateMetadata('Bookmarks', await getSiteSettings())
}

export default async function BookmarksPage() {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('bookmarks').select('path, title, created_at').order('created_at', { ascending: false })
  const bookmarks = data ?? []

  return (
    <section aria-labelledby="bookmarks-title" className="container-reading">
      <h1 id="bookmarks-title" className="text-h2 font-semibold text-text">
        Bookmarks
      </h1>
      {bookmarks.length === 0 ? (
        <EmptyState className="mt-6" title="No bookmarks yet" description="Tap “Bookmark” on any course, week or notes page." />
      ) : (
        <ul className="mt-6 divide-y divide-border rounded-card border border-border bg-card">
          {bookmarks.map((bookmark) => (
            <li key={bookmark.path} className="flex items-center gap-3 px-4 py-3">
              <Link href={bookmark.path} className="min-w-0 flex-1">
                <span className="block font-medium text-text hover:text-accent-ink">{bookmark.title}</span>
                <span className="block text-xs text-muted">Saved {formatDate(bookmark.created_at)}</span>
              </Link>
              <form action={removeBookmark}>
                <input type="hidden" name="path" value={bookmark.path} />
                <button
                  type="submit"
                  className="flex size-11 items-center justify-center rounded-control text-muted hover:bg-surface hover:text-danger"
                  aria-label={`Remove bookmark: ${bookmark.title}`}
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
