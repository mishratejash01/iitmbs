import Link from 'next/link'

import { AdminHeader, Panel, StatCard } from '@/components/admin/ui'
import { ButtonLink } from '@/components/ui/button'
import { adminDb } from '@/lib/admin/records'
import { requireStaff } from '@/lib/auth/session'
import { getSiteSettings } from '@/lib/data/settings'
import { formatDateTime, formatDuration } from '@/lib/utils/dates'
import { formatCount } from '@/lib/utils/format'

// Staff-only and always fresh: renders on request, never from a prefetch.
export const instant = false

const PLACEHOLDER_RELEASE = '2090-01-01T00:00:00Z'

type Row = Record<string, unknown>

export default async function AdminDashboardPage() {
  const [profile, settings, db] = await Promise.all([requireStaff(), getSiteSettings(), adminDb()])
  const now = new Date()
  const nowIso = now.toISOString()
  const staleBefore = new Date(
    now.getTime() - settings.content.stale_days * 86_400_000,
  ).toISOString()
  const today = nowIso.slice(0, 10)
  const weekAgo = new Date(now.getTime() - 6 * 86_400_000).toISOString().slice(0, 10)

  const count = async (table: 'notes' | 'assignments' | 'pages', state: 'live' | 'draft') => {
    const query = db.from(table).select('id', { count: 'exact', head: true }).is('deleted_at', null)
    const { count: n } = await (state === 'live'
      ? query.eq('is_published', true).lte('published_at', nowIso)
      : query.eq('is_published', false))
    return n ?? 0
  }

  const [
    liveNotes,
    draftNotes,
    liveAssignments,
    draftAssignments,
    livePages,
    newFeedback,
    releases,
    scheduled,
    placeholders,
    stale,
    recent,
    totals,
  ] = await Promise.all([
    count('notes', 'live'),
    count('notes', 'draft'),
    count('assignments', 'live'),
    count('assignments', 'draft'),
    count('pages', 'live'),
    db
      .from('content_feedback')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'new')
      .then((r) => r.count ?? 0),
    db
      .from('assignments')
      .select('id, title, term, type, due_at, solutions_release_at')
      .is('deleted_at', null)
      .eq('is_published', true)
      .gt('solutions_release_at', nowIso)
      .lt('solutions_release_at', PLACEHOLDER_RELEASE)
      .order('solutions_release_at')
      .limit(8),
    Promise.all(
      (['notes', 'assignments', 'pages'] as const).map((table) =>
        db
          .from(table)
          .select('id, title, published_at')
          .is('deleted_at', null)
          .eq('is_published', true)
          .gt('published_at', nowIso)
          .order('published_at')
          .limit(5)
          .then((r) =>
            ((r.data ?? []) as Row[]).map((row) => ({
              id: String(row.id),
              title: String(row.title),
              published_at: String(row.published_at),
              table,
            })),
          ),
      ),
    ).then((groups) => groups.flat().sort((a, b) => a.published_at.localeCompare(b.published_at))),
    db
      .from('assignments')
      .select('id, title, term')
      .is('deleted_at', null)
      .eq('type', 'graded')
      .eq('is_published', true)
      .gte('solutions_release_at', PLACEHOLDER_RELEASE)
      .limit(10),
    db
      .from('notes')
      .select('id, title, updated_at')
      .is('deleted_at', null)
      .eq('is_published', true)
      .lt('updated_at', staleBefore)
      .order('updated_at')
      .limit(8),
    profile.role === 'admin'
      ? db
          .from('audit_log')
          .select('id, table_name, record_id, action, changed_fields, occurred_at')
          .order('occurred_at', { ascending: false })
          .limit(10)
      : Promise.resolve({ data: [] }),
    profile.role === 'admin'
      ? db.rpc('admin_overview_totals', { p_from: weekAgo, p_to: today })
      : Promise.resolve({ data: null }),
  ])

  const t = (totals.data ?? null) as Record<string, number | null> | null

  return (
    <>
      <AdminHeader
        title={`Hello${profile.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}`}
        description="What is live, what is scheduled and what needs attention."
        actions={
          <>
            <ButtonLink href="/admin/notes/new" size="sm">
              New note
            </ButtonLink>
            <ButtonLink href="/admin/assignments/new" size="sm" variant="secondary">
              New assignment
            </ButtonLink>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Live notes"
          value={liveNotes}
          hint={`${draftNotes} drafts`}
          href="/admin/notes?status=live"
        />
        <StatCard
          label="Live assignments"
          value={liveAssignments}
          hint={`${draftAssignments} drafts`}
          href="/admin/assignments?status=live"
        />
        <StatCard label="Live pages" value={livePages} href="/admin/pages?status=live" />
        <StatCard label="New feedback" value={newFeedback} href="/admin/feedback" />
        {t ? (
          <>
            <StatCard
              label="Visitors (7 days)"
              value={formatCount(Number(t.visitors ?? 0))}
              href="/admin/analytics"
            />
            <StatCard
              label="Page views (7 days)"
              value={formatCount(Number(t.page_views ?? 0))}
              href="/admin/analytics"
            />
          </>
        ) : null}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Solution releases coming up">
          {releases.data?.length ? (
            <ul className="divide-y divide-border">
              {(releases.data as Row[]).map((a) => (
                <li
                  key={String(a.id)}
                  className="flex flex-wrap items-baseline justify-between gap-2 py-2.5"
                >
                  <Link
                    href={`/admin/assignments/${a.id}`}
                    className="font-medium text-text hover:text-accent-ink hover:underline"
                  >
                    {String(a.title)}
                  </Link>
                  <span className="text-small text-muted">
                    {formatDateTime(String(a.solutions_release_at))} · in{' '}
                    {formatDuration(
                      (Date.parse(String(a.solutions_release_at)) - now.getTime()) / 1000,
                    )}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-small text-muted">
              No scheduled releases. Released pages unlock automatically at the time you set.
            </p>
          )}
        </Panel>

        <Panel title="Scheduled to go live">
          {scheduled.length ? (
            <ul className="divide-y divide-border">
              {scheduled.map((item) => (
                <li
                  key={`${item.table}-${item.id}`}
                  className="flex flex-wrap items-baseline justify-between gap-2 py-2.5"
                >
                  <Link
                    href={`/admin/${item.table}/${item.id}`}
                    className="font-medium text-text hover:text-accent-ink hover:underline"
                  >
                    {item.title}
                  </Link>
                  <span className="text-small text-muted">{formatDateTime(item.published_at)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-small text-muted">
              Nothing scheduled. Set “Go live at” on a note, assignment or page to schedule it.
            </p>
          )}
        </Panel>

        <Panel title="Needs attention">
          <ul className="space-y-2 text-small">
            {((placeholders.data ?? []) as Row[]).map((a) => (
              <li key={String(a.id)}>
                <Link href={`/admin/assignments/${a.id}`} className="text-warning hover:underline">
                  {String(a.title)}
                </Link>{' '}
                <span className="text-muted">
                  is live but its solution release time is still the placeholder.
                </span>
              </li>
            ))}
            {((stale.data ?? []) as Row[]).map((n) => (
              <li key={String(n.id)}>
                <Link href={`/admin/notes/${n.id}`} className="text-text hover:underline">
                  {String(n.title)}
                </Link>{' '}
                <span className="text-muted">
                  not updated since {formatDateTime(String(n.updated_at))} — check it is still
                  accurate.
                </span>
              </li>
            ))}
            {!placeholders.data?.length && !stale.data?.length ? (
              <li className="text-muted">All clear.</li>
            ) : null}
          </ul>
          <p className="mt-3 text-xs text-muted">
            For thin pages, missing descriptions and other SEO checks see the{' '}
            <Link href="/admin/seo" className="text-accent-ink underline">
              SEO report
            </Link>
            .
          </p>
        </Panel>

        {profile.role === 'admin' ? (
          <Panel
            title="Recent changes"
            actions={
              <Link href="/admin/audit" className="text-small text-accent-ink hover:underline">
                Full audit log
              </Link>
            }
          >
            {recent.data?.length ? (
              <ul className="divide-y divide-border text-small">
                {(recent.data as Row[]).map((entry) => (
                  <li key={String(entry.id)} className="flex flex-wrap justify-between gap-2 py-2">
                    <span className="text-text">
                      <span className="font-medium capitalize">{String(entry.action)}</span>{' '}
                      {String(entry.table_name).replace(/_/g, ' ')}
                      {Array.isArray(entry.changed_fields) && entry.changed_fields.length ? (
                        <span className="text-muted">
                          {' '}
                          · {(entry.changed_fields as string[]).slice(0, 4).join(', ')}
                        </span>
                      ) : null}
                    </span>
                    <span className="text-muted">{formatDateTime(String(entry.occurred_at))}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-small text-muted">No changes recorded yet.</p>
            )}
          </Panel>
        ) : null}
      </div>
    </>
  )
}
