import Link from 'next/link'

import { AdminHeader, Table, inputClasses } from '@/components/admin/ui'
import { buttonClasses } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { adminDb } from '@/lib/admin/records'
import { RESOURCES } from '@/lib/admin/resources'
import { requireAdmin } from '@/lib/auth/session'
import { formatDateTime } from '@/lib/utils/dates'

// Admin-only and always fresh: renders on request, never from a prefetch.
export const instant = false

const PAGE_SIZE = 50
const TABLES = [
  ...RESOURCES.map((r) => ({ table: r.table as string, label: r.label })),
  { table: 'site_settings', label: 'Settings' },
  { table: 'profiles', label: 'User roles' },
  { table: 'course_programs', label: 'Course cross-listing' },
]

type AuditRow = {
  id: number
  occurred_at: string
  actor_id: string | null
  actor_role: string | null
  table_name: string
  record_id: string | null
  action: string
  changed_fields: string[]
  diff: Record<string, [unknown, unknown]>
}

const one = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value) ?? ''
const show = (value: unknown) =>
  value === null || value === undefined
    ? '∅'
    : typeof value === 'string'
      ? value
      : JSON.stringify(value)

export default async function AuditPage({ searchParams }: PageProps<'/admin/audit'>) {
  await requireAdmin()
  const query = await searchParams
  const table = one(query.table)
  const actor = one(query.actor)
  const page = Math.max(1, Number(one(query.page)) || 1)

  const db = await adminDb()
  let request = db
    .from('audit_log')
    .select(
      'id, occurred_at, actor_id, actor_role, table_name, record_id, action, changed_fields, diff',
    )
    .order('occurred_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  if (TABLES.some((t) => t.table === table)) request = request.eq('table_name', table)
  if (/^[0-9a-f-]{36}$/i.test(actor)) request = request.eq('actor_id', actor)
  const { data } = await request
  const fetched = (data ?? []) as AuditRow[]
  const rows = fetched.slice(0, PAGE_SIZE)
  const hasMore = fetched.length > PAGE_SIZE

  const actorIds = [...new Set(rows.map((r) => r.actor_id).filter((v): v is string => Boolean(v)))]
  const { data: actors } = actorIds.length
    ? await db.from('profiles').select('id, email, full_name').in('id', actorIds)
    : { data: [] }
  const actorName = new Map(
    ((actors ?? []) as Array<{ id: string; email: string | null; full_name: string | null }>).map(
      (a) => [a.id, a.full_name || a.email || a.id],
    ),
  )

  const pageHref = (n: number) =>
    `/admin/audit?${new URLSearchParams({ ...(table ? { table } : {}), ...(actor ? { actor } : {}), page: String(n) })}`

  return (
    <>
      <AdminHeader
        title="Audit log"
        description="Every change to content, settings and roles: who made it, when, and what changed. Long values are shortened."
      />
      <form method="get" className="mb-4 flex flex-wrap items-end gap-2">
        <div>
          <label htmlFor="audit-table" className="text-xs font-medium text-muted">
            Area
          </label>
          <select id="audit-table" name="table" defaultValue={table} className={inputClasses}>
            <option value="">Everything</option>
            {TABLES.map((t) => (
              <option key={t.table} value={t.table}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        {actor ? <input type="hidden" name="actor" value={actor} /> : null}
        <button type="submit" className={buttonClasses('secondary', 'sm')}>
          Apply
        </button>
        {actor ? (
          <Link
            href={`/admin/audit${table ? `?table=${table}` : ''}`}
            className="text-small text-accent-ink hover:underline"
          >
            Clear person filter
          </Link>
        ) : null}
      </form>

      {rows.length === 0 ? (
        <EmptyState title="No changes recorded" />
      ) : (
        <Table>
          <thead>
            <tr>
              <th scope="col">When</th>
              <th scope="col">Who</th>
              <th scope="col">What</th>
              <th scope="col">Changes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const resource = RESOURCES.find((r) => r.table === row.table_name)
              const label = TABLES.find((t) => t.table === row.table_name)?.label ?? row.table_name
              return (
                <tr key={row.id}>
                  <td className="whitespace-nowrap text-muted">
                    {formatDateTime(row.occurred_at)}
                  </td>
                  <td className="whitespace-nowrap">
                    {row.actor_id ? (
                      <Link
                        href={`/admin/audit?actor=${row.actor_id}`}
                        className="text-text hover:text-accent-ink hover:underline"
                      >
                        {actorName.get(row.actor_id) ?? 'Unknown'}
                      </Link>
                    ) : (
                      <span className="text-muted">System</span>
                    )}
                    <p className="text-xs text-muted">{row.actor_role}</p>
                  </td>
                  <td className="min-w-40">
                    <span className="font-medium text-text capitalize">{row.action}</span>{' '}
                    <span className="text-muted">{label}</span>
                    {resource && row.record_id && row.action !== 'delete' ? (
                      <p>
                        <Link
                          href={`/admin/${resource.key}/${row.record_id}`}
                          className="text-xs text-accent-ink hover:underline"
                        >
                          Open
                        </Link>
                      </p>
                    ) : null}
                  </td>
                  <td className="min-w-64">
                    {row.changed_fields.length ? (
                      <details>
                        <summary className="cursor-pointer text-text">
                          {row.changed_fields.join(', ')}
                        </summary>
                        <dl className="mt-2 space-y-2">
                          {Object.entries(row.diff ?? {}).map(([field, [before, after]]) => (
                            <div key={field}>
                              <dt className="text-xs font-medium text-muted">{field}</dt>
                              <dd className="break-words">
                                <span className="rounded bg-danger-soft px-1 text-text">
                                  {show(before)}
                                </span>{' '}
                                →{' '}
                                <span className="rounded bg-success-soft px-1 text-text">
                                  {show(after)}
                                </span>
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </details>
                    ) : (
                      <span className="text-muted">
                        {row.action === 'insert'
                          ? 'Created'
                          : row.action === 'delete'
                            ? 'Deleted'
                            : '—'}
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      )}

      <nav aria-label="Pages" className="mt-4 flex items-center justify-between text-small">
        {page > 1 ? (
          <Link href={pageHref(page - 1)} className={buttonClasses('secondary', 'sm')}>
            ← Newer
          </Link>
        ) : (
          <span />
        )}
        {hasMore ? (
          <Link href={pageHref(page + 1)} className={buttonClasses('secondary', 'sm')}>
            Older →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </>
  )
}
