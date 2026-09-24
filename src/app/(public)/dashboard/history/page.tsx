import type { Metadata } from 'next'
import Link from 'next/link'

import { metaRowClasses } from '@/components/ui/badge'
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
              <Link
                href="/dashboard/settings"
                className="text-accent-ink underline decoration-accent-ink/30 underline-offset-4 hover:decoration-accent-ink"
              >
                Change in settings
              </Link>
              .
            </>
          }
        />
      ) : (
        <ul className="mt-6 border-t border-border">
          {history.map((item) => (
            <li key={item.path} className="border-b border-border">
              <Link href={item.path} className="group block py-4">
                <span className="block font-medium text-text decoration-accent-ink/40 underline-offset-4 group-hover:text-accent-ink group-hover:underline">
                  {item.title}
                </span>
                <span className={`mt-0.5 text-xs text-muted ${metaRowClasses}`}>
                  <span>{formatDateTime(item.last_visited_at)}</span>
                  <span>
                    {item.visit_count} visit{item.visit_count === 1 ? '' : 's'}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
