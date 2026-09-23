import Link from 'next/link'

import { setUserRole } from '@/app/admin/actions'
import { AdminHeader, Notice, Table, inputClasses } from '@/components/admin/ui'
import { Badge } from '@/components/ui/badge'
import { buttonClasses } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { adminDb } from '@/lib/admin/records'
import { requireAdmin } from '@/lib/auth/session'
import { formatDate, formatDateTime } from '@/lib/utils/dates'

// Admin-only and always fresh: renders on request, never from a prefetch.
export const instant = false

const PAGE_SIZE = 50
const ROLES = ['student', 'editor', 'admin'] as const
const ERRORS: Record<string, string> = {
  self: 'You cannot remove your own admin role — ask another admin.',
  invalid: 'That change was not valid.',
  failed: 'The role could not be changed.',
}

const one = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value) ?? ''

type ProfileRow = {
  id: string
  email: string | null
  full_name: string | null
  role: (typeof ROLES)[number]
  program_id: string | null
  current_term: string | null
  analytics_consent: boolean
  created_at: string
  last_seen_at: string
}

export default async function UsersPage({ searchParams }: PageProps<'/admin/users'>) {
  const me = await requireAdmin()
  const query = await searchParams
  const q = one(query.q)
    .replace(/[,()%*\\]/g, ' ')
    .trim()
  const role = one(query.role)
  const page = Math.max(1, Number(one(query.page)) || 1)

  const db = await adminDb()
  let request = db
    .from('profiles')
    .select(
      'id, email, full_name, role, program_id, current_term, analytics_consent, created_at, last_seen_at',
      { count: 'exact' },
    )
  if (q) request = request.or(`email.ilike.%${q}%,full_name.ilike.%${q}%`)
  if ((ROLES as readonly string[]).includes(role)) request = request.eq('role', role)
  const [{ data, count }, { data: programs }] = await Promise.all([
    request
      .order('last_seen_at', { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
    db.from('programs').select('id, short_name'),
  ])
  const users = (data ?? []) as ProfileRow[]
  const programName = new Map(
    ((programs ?? []) as Array<{ id: string; short_name: string }>).map((p) => [
      p.id,
      p.short_name,
    ]),
  )
  const total = count ?? users.length
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const here = `/admin/users?${new URLSearchParams({ ...(q ? { q } : {}), ...(role ? { role } : {}), ...(page > 1 ? { page: String(page) } : {}) })}`
  const pageHref = (n: number) =>
    `/admin/users?${new URLSearchParams({ ...(q ? { q } : {}), ...(role ? { role } : {}), page: String(n) })}`

  return (
    <>
      <AdminHeader
        title="Users"
        description={`${total} ${total === 1 ? 'account' : 'accounts'}. Editors can write and publish content; admins can also change settings, navigation and roles.`}
      />
      {one(query.updated) ? <Notice>Role updated.</Notice> : null}
      {ERRORS[one(query.error)] ? <Notice tone="danger">{ERRORS[one(query.error)]}</Notice> : null}

      <form method="get" role="search" className="mb-4 flex flex-wrap items-end gap-2">
        <div className="min-w-48 flex-1">
          <label htmlFor="users-q" className="text-xs font-medium text-muted">
            Search by name or email
          </label>
          <input id="users-q" name="q" type="search" defaultValue={q} className={inputClasses} />
        </div>
        <div>
          <label htmlFor="users-role" className="text-xs font-medium text-muted">
            Role
          </label>
          <select id="users-role" name="role" defaultValue={role} className={inputClasses}>
            <option value="">All</option>
            {ROLES.map((r) => (
              <option key={r} value={r} className="capitalize">
                {r}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className={buttonClasses('secondary', 'sm')}>
          Apply
        </button>
      </form>

      {users.length === 0 ? (
        <EmptyState
          title="No accounts found"
          description="People appear here after they first sign in with Google."
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <th scope="col">Person</th>
              <th scope="col">Programme</th>
              <th scope="col">Joined</th>
              <th scope="col">Last seen</th>
              <th scope="col">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="min-w-56">
                  <p className="font-medium text-text">{user.full_name || '—'}</p>
                  <p className="text-muted">{user.email}</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {user.id === me.id ? <Badge tone="accent">You</Badge> : null}
                    {user.analytics_consent ? (
                      <Link
                        href={`/admin/analytics/users/${user.id}`}
                        className="text-xs text-accent-ink hover:underline"
                      >
                        Activity timeline
                      </Link>
                    ) : null}
                  </div>
                </td>
                <td className="whitespace-nowrap text-muted">
                  {user.program_id ? programName.get(user.program_id) : '—'}
                  {user.current_term ? ` · ${user.current_term}` : ''}
                </td>
                <td className="whitespace-nowrap text-muted">{formatDate(user.created_at)}</td>
                <td className="whitespace-nowrap text-muted">
                  {formatDateTime(user.last_seen_at)}
                </td>
                <td>
                  <form action={setUserRole} className="flex items-center gap-2">
                    <input type="hidden" name="user_id" value={user.id} />
                    <input type="hidden" name="back" value={here} />
                    <label htmlFor={`role-${user.id}`} className="sr-only">
                      Role for {user.email}
                    </label>
                    <select
                      id={`role-${user.id}`}
                      name="role"
                      defaultValue={user.role}
                      className={`${inputClasses} w-auto`}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r[0]!.toUpperCase() + r.slice(1)}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className={buttonClasses('secondary', 'sm')}>
                      Save
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {pages > 1 ? (
        <nav aria-label="Pages" className="mt-4 flex items-center justify-between text-small">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className={buttonClasses('secondary', 'sm')}>
              ← Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-muted">
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link href={pageHref(page + 1)} className={buttonClasses('secondary', 'sm')}>
              Next →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </>
  )
}
