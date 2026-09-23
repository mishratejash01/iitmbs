import type { Metadata } from 'next'
import Link from 'next/link'

import { DeadlineWidget } from '@/components/content/deadline-widget'
import { LinkList } from '@/components/content/link-list'
import { ButtonLink } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { getCurrentProfile } from '@/lib/auth/session'
import { getProgramPage, getPrograms } from '@/lib/data/programs'
import { getSiteSettings } from '@/lib/data/settings'
import { getUpcomingDeadlines } from '@/lib/data/upcoming'
import { formatTerm } from '@/lib/routes'
import { privateMetadata } from '@/lib/seo/metadata'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function generateMetadata(): Promise<Metadata> {
  return privateMetadata('Dashboard', await getSiteSettings())
}

export default async function DashboardPage() {
  const profile = await getCurrentProfile()
  const supabase = await createSupabaseServerClient()
  const [programs, deadlines, history, bookmarks, progress] = await Promise.all([
    getPrograms(),
    getUpcomingDeadlines(),
    supabase.from('reading_history').select('path, title, last_visited_at').order('last_visited_at', { ascending: false }).limit(5),
    supabase.from('bookmarks').select('path, title').order('created_at', { ascending: false }).limit(5),
    supabase.from('progress').select('item_id', { count: 'exact', head: true }),
  ])
  const program = programs.find((p) => p.id === profile?.program_id) ?? null
  const programPage = program ? await getProgramPage(program.slug) : null
  const myDeadlines = program ? deadlines.filter((d) => d.programShortName === program.shortName) : deadlines

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-h2 font-semibold text-text">Hi{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''} 👋</h1>
        <p className="mt-1 text-muted">
          {program ? `${program.shortName} qualifier` : 'No programme chosen yet'}
          {profile?.current_term ? ` · ${formatTerm(profile.current_term)} term` : ''} ·{' '}
          <Link href="/dashboard/settings" className="text-accent-ink underline">
            change
          </Link>
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="space-y-8 lg:col-span-3">
          {programPage ? (
            <section aria-labelledby="my-courses">
              <h2 id="my-courses" className="mb-3 text-h3 font-semibold">
                Your courses
              </h2>
              <LinkList
                label="Your courses"
                items={programPage.courses.map((c) => ({ path: c.path, title: c.name, summary: `${c.shortName} · ${c.weeksCount} weeks` }))}
              />
            </section>
          ) : null}

          <section aria-labelledby="continue">
            <h2 id="continue" className="mb-3 text-h3 font-semibold">
              Continue reading
            </h2>
            {(history.data ?? []).length > 0 ? (
              <LinkList label="Recently read" items={(history.data ?? []).map((h) => ({ path: h.path, title: h.title }))} />
            ) : (
              <EmptyState
                title="Nothing here yet"
                description="Pages you read appear here when detailed analytics are on (Settings → Analytics)."
              />
            )}
          </section>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <DeadlineWidget deadlines={myDeadlines} />
          <section aria-labelledby="saved" className="rounded-card border border-border bg-card p-4">
            <h2 id="saved" className="font-semibold text-text">
              Bookmarks
            </h2>
            {(bookmarks.data ?? []).length > 0 ? (
              <ul className="mt-2">
                {(bookmarks.data ?? []).map((b) => (
                  <li key={b.path}>
                    <Link href={b.path} className="flex min-h-11 items-center text-small font-medium text-accent-ink hover:underline">
                      {b.title}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-small text-muted">Use the Bookmark button on any page to save it here.</p>
            )}
            <ButtonLink href="/dashboard/bookmarks" variant="ghost" size="sm" className="mt-2 -ml-3">
              All bookmarks
            </ButtonLink>
          </section>
          <p className="text-small text-muted">
            You have ticked off <span className="font-semibold text-text">{progress.count ?? 0}</span> study items.
          </p>
        </div>
      </div>
    </div>
  )
}
