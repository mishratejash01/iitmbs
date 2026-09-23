import Link from 'next/link'
import { notFound } from 'next/navigation'

import { formatValue } from '@/components/admin/charts/scale'
import { AdminHeader, Panel } from '@/components/admin/ui'
import { Badge, type BadgeTone } from '@/components/ui/badge'
import { buttonClasses } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { adminDb } from '@/lib/admin/records'
import { requireAdmin } from '@/lib/auth/session'
import { formatDate, formatDateTime } from '@/lib/utils/dates'

// Admin-only and always fresh: renders on request, never from a prefetch.
export const instant = false

const PAGE_SIZE = 200

type Entry = {
  occurred_at: string
  kind: string
  name: string
  path: string | null
  detail: Record<string, unknown> | null
}

const KIND: Record<string, { label: string; tone: BadgeTone }> = {
  page_view: { label: 'Page', tone: 'neutral' },
  event: { label: 'Action', tone: 'accent' },
  download: { label: 'Download', tone: 'success' },
  search: { label: 'Search', tone: 'accent' },
  auth: { label: 'Account', tone: 'warning' },
}

const dayKey = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' })
const timeOfDay = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  hour: 'numeric',
  minute: '2-digit',
})

function describe(entry: Entry): string {
  const d = entry.detail ?? {}
  switch (entry.kind) {
    case 'page_view': {
      const parts = [
        typeof d.title === 'string' ? d.title.split(' | ')[0] : entry.name.replace(/_/g, ' '),
      ]
      if (typeof d.engaged_seconds === 'number' && d.engaged_seconds > 0)
        parts.push(`${formatValue(d.engaged_seconds, 'seconds')} engaged`)
      if (typeof d.max_scroll === 'number' && d.max_scroll > 0) parts.push(`read ${d.max_scroll}%`)
      return parts.join(' · ')
    }
    case 'search':
      return `“${entry.name}” · ${typeof d.results === 'number' ? `${d.results} results` : 'results unknown'}${entry.path ? ` · opened ${entry.path}` : ''}`
    case 'auth':
      return `${entry.name.replace(/_/g, ' ')}${typeof d.reason === 'string' ? ` (${d.reason})` : ''}`
    default:
      return entry.name.replace(/_/g, ' ')
  }
}

/** Everything one consenting user did, newest first. Linked activity exists only with detailed consent. */
export default async function UserTimelinePage({
  params,
  searchParams,
}: PageProps<'/admin/analytics/users/[id]'>) {
  await requireAdmin()
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const query = await searchParams
  const before =
    typeof query.before === 'string' && !Number.isNaN(Date.parse(query.before))
      ? query.before
      : null

  const db = await adminDb()
  const [{ data: profile }, { data, error }] = await Promise.all([
    db
      .from('profiles')
      .select('email, full_name, role, analytics_consent, created_at, last_seen_at')
      .eq('id', id)
      .maybeSingle(),
    db.rpc('admin_user_timeline', { p_user_id: id, p_before: before, p_limit: PAGE_SIZE }),
  ])
  if (!profile) notFound()
  if (error) throw new Error(error.message)
  const entries = (data ?? []) as Entry[]

  const days = new Map<string, Entry[]>()
  for (const entry of entries) {
    const key = dayKey.format(new Date(entry.occurred_at))
    days.set(key, [...(days.get(key) ?? []), entry])
  }
  const oldest = entries[entries.length - 1]?.occurred_at

  return (
    <>
      <AdminHeader
        back={{ href: '/admin/users', label: 'Users' }}
        title={profile.full_name || profile.email || 'User'}
        description={
          <>
            {profile.email} · joined {formatDate(profile.created_at)} · last seen{' '}
            {formatDateTime(profile.last_seen_at)} ·{' '}
            {profile.analytics_consent
              ? 'detailed analytics allowed'
              : 'essential analytics only (activity is not linked to the account)'}
          </>
        }
      />
      {entries.length === 0 ? (
        <EmptyState
          title="No linked activity"
          description="Activity is linked to an account only after the student allows detailed analytics."
        />
      ) : (
        <div className="space-y-4">
          {[...days.entries()].map(([day, items]) => (
            <Panel key={day} title={formatDate(`${day}T12:00:00+05:30`)}>
              <ol className="space-y-2">
                {items.map((entry, index) => (
                  <li
                    key={`${entry.occurred_at}-${index}`}
                    className="grid grid-cols-[4.5rem_6rem_1fr] items-baseline gap-2 text-small"
                  >
                    <time dateTime={entry.occurred_at} className="text-muted tabular-nums">
                      {timeOfDay.format(new Date(entry.occurred_at))}
                    </time>
                    <span>
                      <Badge tone={KIND[entry.kind]?.tone ?? 'neutral'}>
                        {KIND[entry.kind]?.label ?? entry.kind}
                      </Badge>
                    </span>
                    <span className="min-w-0 break-words text-text">
                      {describe(entry)}
                      {entry.path && entry.kind !== 'search' ? (
                        <span className="block text-xs text-muted">{entry.path}</span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ol>
            </Panel>
          ))}
          {entries.length === PAGE_SIZE && oldest ? (
            <Link
              href={`/admin/analytics/users/${id}?before=${encodeURIComponent(oldest)}`}
              className={buttonClasses('secondary', 'sm')}
            >
              Older activity →
            </Link>
          ) : null}
        </div>
      )}
    </>
  )
}
