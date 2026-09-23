import type { Metadata } from 'next'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { getSiteSettings } from '@/lib/data/settings'
import { privateMetadata } from '@/lib/seo/metadata'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { formatDateTime } from '@/lib/utils/dates'

import { clearHistory } from '../actions'

// Reads the session, so it renders on each request.
export const instant = false

export async function generateMetadata(): Promise<Metadata> {
  return privateMetadata('Reading history', await getSiteSettings())
}

export default async function HistoryPage() {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('reading_history')
    .select('path, title, visit_count, last_visited_at')
    .order('last_visited_at', { ascending: false })
    .limit(200)
  const history = data ?? []

  return (
    <section aria-labelledby="history-title" className="container-reading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 id="history-title" className="text-h2 font-semibold text-text">
          Reading history
        </h1>
        {history.length > 0 ? (
          <form action={clearHistory}>
            <Button type="submit" variant="secondary" size="sm">
              Clear history
            </Button>
          </form>
        ) : null}
      </div>
      {history.length === 0 ? (
        <EmptyState
          className="mt-6"
          title="No history yet"
          description={
            <>
              History is recorded only when detailed analytics are on.{' '}
              <Link href="/dashboard/settings" className="text-accent-ink underline">
                Change in settings
              </Link>
              .
            </>
          }
        />
      ) : (
        <ul className="mt-6 divide-y divide-border rounded-card border border-border bg-card">
          {history.map((item) => (
            <li key={item.path}>
              <Link href={item.path} className="block px-4 py-3 hover:bg-surface">
                <span className="block font-medium text-text">{item.title}</span>
                <span className="block text-xs text-muted">
                  {formatDateTime(item.last_visited_at)} · {item.visit_count} visit
                  {item.visit_count === 1 ? '' : 's'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
