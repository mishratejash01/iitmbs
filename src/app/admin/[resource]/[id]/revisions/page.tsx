import { notFound } from 'next/navigation'

import { restoreRevision } from '@/app/admin/actions'
import { AdminHeader, Panel } from '@/components/admin/ui'
import { EmptyState } from '@/components/ui/empty-state'
import { buttonClasses } from '@/components/ui/button'
import { columnLabel, displayValue, recordTitle } from '@/lib/admin/display'
import { adminDb, getRecord } from '@/lib/admin/records'
import { getResource } from '@/lib/admin/resources'
import { requireStaff } from '@/lib/auth/session'
import { formatDateTime } from '@/lib/utils/dates'

// Staff-only and always fresh: renders on request, never from a prefetch.
export const instant = false

const IGNORED = new Set([
  'updated_at',
  'updated_by',
  'created_at',
  'created_by',
  'version',
  'word_count',
  'reading_time_minutes',
  'search_vector',
])

export default async function RevisionsPage({
  params,
}: PageProps<'/admin/[resource]/[id]/revisions'>) {
  const { resource, id } = await params
  const config = getResource(resource)
  if (!config?.revisions || !/^[0-9a-f-]{36}$/i.test(id)) notFound()
  await requireStaff()

  const row = await getRecord(config, id)
  if (!row) notFound()
  const db = await adminDb()
  const { data } = await db
    .from('content_revisions')
    .select('id, revision, snapshot, changed_by, created_at')
    .eq('table_name', config.table)
    .eq('record_id', id)
    .order('revision', { ascending: false })
    .limit(50)
  const revisions = (data ?? []) as Array<{
    id: number
    revision: number
    snapshot: Record<string, unknown>
    changed_by: string | null
    created_at: string
  }>

  const editorIds = [
    ...new Set(revisions.map((r) => r.changed_by).filter((v): v is string => Boolean(v))),
  ]
  const { data: editors } = editorIds.length
    ? await db.from('profiles').select('id, full_name, email').in('id', editorIds)
    : { data: [] }
  const editorName = new Map(
    ((editors ?? []) as Array<{ id: string; full_name: string | null; email: string | null }>).map(
      (e) => [e.id, e.full_name || e.email || 'Unknown'],
    ),
  )

  // Each snapshot is the version *before* a change; compare it with what came next.
  const versions = [row as Record<string, unknown>, ...revisions.map((r) => r.snapshot)]

  return (
    <>
      <AdminHeader
        title="History"
        description={`Earlier versions of “${recordTitle(config, row)}”. Restoring copies that version into the current one (and keeps this history).`}
        back={{ href: `/admin/${config.key}/${id}`, label: 'Back to editor' }}
      />
      {revisions.length === 0 ? (
        <EmptyState
          title="No earlier versions yet"
          description="A version is saved each time this item changes."
        />
      ) : (
        <ol className="space-y-4">
          {revisions.map((revision, index) => {
            const newer = versions[index]!
            const changed = Object.keys(revision.snapshot).filter(
              (key) =>
                !IGNORED.has(key) &&
                JSON.stringify(revision.snapshot[key]) !== JSON.stringify(newer[key]),
            )
            return (
              <li key={revision.id}>
                <Panel
                  title={`Version ${revision.revision}`}
                  actions={
                    <form action={restoreRevision.bind(null, config.key, id, revision.id)}>
                      <button type="submit" className={buttonClasses('secondary', 'sm')}>
                        Restore this version
                      </button>
                    </form>
                  }
                >
                  <p className="text-small text-muted">
                    Replaced {formatDateTime(revision.created_at)}
                    {revision.changed_by
                      ? ` by ${editorName.get(revision.changed_by) ?? 'an editor'}`
                      : ''}
                    .{' '}
                    {changed.length
                      ? `Changed afterwards: ${changed.map((c) => columnLabel(config, c)).join(', ')}.`
                      : 'No visible field changes.'}
                  </p>
                  {changed.length ? (
                    <dl className="mt-3 space-y-3 text-small">
                      <div
                        aria-hidden="true"
                        className="hidden text-xs font-medium text-muted sm:grid sm:grid-cols-[10rem_1fr_1fr] sm:gap-3"
                      >
                        <span />
                        <span>This version</span>
                        <span>What replaced it</span>
                      </div>
                      {changed.slice(0, 8).map((key) => (
                        <div key={key} className="grid gap-1 sm:grid-cols-[10rem_1fr_1fr] sm:gap-3">
                          <dt className="font-medium text-text">{columnLabel(config, key)}</dt>
                          <dd className="rounded bg-danger-soft px-2 py-1 break-words text-text">
                            <span className="sr-only">This version: </span>
                            {displayValue(config, key, revision.snapshot[key])}
                          </dd>
                          <dd className="rounded bg-success-soft px-2 py-1 break-words text-text">
                            <span className="sr-only">What replaced it: </span>
                            {displayValue(config, key, newer[key])}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}
                </Panel>
              </li>
            )
          })}
        </ol>
      )}
    </>
  )
}
