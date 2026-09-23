import Link from 'next/link'

import { setFeedbackStatus } from '@/app/admin/actions'
import { AdminHeader, Panel, Table } from '@/components/admin/ui'
import { Badge } from '@/components/ui/badge'
import { buttonClasses } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { adminDb } from '@/lib/admin/records'
import { requireStaff } from '@/lib/auth/session'
import { daysAgo, formatDateTime } from '@/lib/utils/dates'
import { cn } from '@/lib/utils/cn'

// Staff-only and always fresh: renders on request, never from a prefetch.
export const instant = false

const STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'archived', label: 'Archived' },
] as const
type Status = (typeof STATUSES)[number]['value']

type FeedbackRow = {
  id: string
  path: string
  page_type: string | null
  helpful: boolean
  comment: string | null
  status: Status
  created_at: string
}

const one = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value) ?? ''

export default async function FeedbackPage({ searchParams }: PageProps<'/admin/feedback'>) {
  await requireStaff()
  const query = await searchParams
  const status: Status = STATUSES.some((s) => s.value === one(query.status))
    ? (one(query.status) as Status)
    : 'new'
  const onlyComments = one(query.comments) === '1'

  const db = await adminDb()
  let request = db
    .from('content_feedback')
    .select('id, path, page_type, helpful, comment, status, created_at')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(200)
  if (onlyComments) request = request.not('comment', 'is', null)
  const since = daysAgo(30).toISOString()
  const [{ data }, { data: recent }] = await Promise.all([
    request,
    db.from('content_feedback').select('path, helpful').gte('created_at', since).limit(5000),
  ])
  const rows = (data ?? []) as FeedbackRow[]

  // Pages with the most "not helpful" votes in the last 30 days.
  const perPage = new Map<string, { yes: number; no: number }>()
  for (const vote of (recent ?? []) as Array<{ path: string; helpful: boolean }>) {
    const entry = perPage.get(vote.path) ?? { yes: 0, no: 0 }
    if (vote.helpful) entry.yes++
    else entry.no++
    perPage.set(vote.path, entry)
  }
  const worst = [...perPage.entries()]
    .filter(([, v]) => v.no > 0)
    .sort((a, b) => b[1].no - a[1].no || a[1].yes - b[1].yes)
    .slice(0, 8)

  const tabHref = (value: Status) =>
    `/admin/feedback?status=${value}${onlyComments ? '&comments=1' : ''}`

  return (
    <>
      <AdminHeader
        title="Feedback"
        description="“Was this helpful?” votes and comments from students. Review comments, fix the page, then mark them reviewed."
      />

      {worst.length ? (
        <Panel title="Least helpful pages (last 30 days)" className="mb-6">
          <ul className="divide-y divide-border text-small">
            {worst.map(([path, votes]) => (
              <li key={path} className="flex flex-wrap items-baseline justify-between gap-2 py-2">
                <a
                  href={path}
                  target="_blank"
                  rel="noopener"
                  className="text-text hover:text-accent-ink hover:underline"
                >
                  {path}
                </a>
                <span className="text-muted tabular-nums">
                  {votes.no} not helpful · {votes.yes} helpful
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <nav aria-label="Status" className="flex gap-1">
          {STATUSES.map((s) => (
            <Link
              key={s.value}
              href={tabHref(s.value)}
              aria-current={status === s.value ? 'page' : undefined}
              className={cn(
                'inline-flex min-h-10 items-center rounded-control px-3 text-small',
                status === s.value
                  ? 'bg-accent-soft font-medium text-accent-ink'
                  : 'text-text hover:bg-surface',
              )}
            >
              {s.label}
            </Link>
          ))}
        </nav>
        <Link
          href={`/admin/feedback?status=${status}${onlyComments ? '' : '&comments=1'}`}
          className="ml-auto text-small text-accent-ink hover:underline"
        >
          {onlyComments ? 'Show all votes' : 'Only with comments'}
        </Link>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title={`No ${status} feedback`}
          description="New votes and comments appear here as students leave them."
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <th scope="col">Page</th>
              <th scope="col">Vote</th>
              <th scope="col">Comment</th>
              <th scope="col">When</th>
              <th scope="col">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="min-w-48">
                  <a
                    href={row.path}
                    target="_blank"
                    rel="noopener"
                    className="text-text hover:text-accent-ink hover:underline"
                  >
                    {row.path}
                  </a>
                  {row.page_type ? (
                    <p className="text-xs text-muted">{row.page_type.replace(/_/g, ' ')}</p>
                  ) : null}
                </td>
                <td>
                  <Badge tone={row.helpful ? 'success' : 'danger'}>
                    {row.helpful ? 'Helpful' : 'Not helpful'}
                  </Badge>
                </td>
                <td className="max-w-md break-words text-text">
                  {row.comment ?? <span className="text-muted">—</span>}
                </td>
                <td className="whitespace-nowrap text-muted">{formatDateTime(row.created_at)}</td>
                <td>
                  <div className="flex gap-1">
                    {STATUSES.filter((s) => s.value !== row.status).map((s) => (
                      <form key={s.value} action={setFeedbackStatus.bind(null, row.id, s.value)}>
                        <button type="submit" className={buttonClasses('ghost', 'sm')}>
                          {s.value === 'new'
                            ? 'Reopen'
                            : s.value === 'reviewed'
                              ? 'Mark reviewed'
                              : 'Archive'}
                        </button>
                      </form>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  )
}
