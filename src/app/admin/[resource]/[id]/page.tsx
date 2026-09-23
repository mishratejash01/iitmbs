import Link from 'next/link'
import { notFound } from 'next/navigation'

import { hardDelete, setDeleted } from '@/app/admin/actions'
import { ResourceEditor } from '@/components/admin/resource-editor'
import { AdminHeader, Notice, Panel, StatusBadge, Table } from '@/components/admin/ui'
import { ButtonLink, buttonClasses } from '@/components/ui/button'
import { displayValue, recordTitle } from '@/lib/admin/display'
import { publicPathFor } from '@/lib/admin/paths'
import { adminDb, getRecord, statusOf } from '@/lib/admin/records'
import { getResource, type ResourceConfig } from '@/lib/admin/resources'
import { requireAdmin, requireStaff } from '@/lib/auth/session'
import { formatDateTime } from '@/lib/utils/dates'

// Staff-only and always fresh: renders on request, never from a prefetch.
export const instant = false

export default async function EditRecordPage({
  params,
  searchParams,
}: PageProps<'/admin/[resource]/[id]'>) {
  const { resource, id: rawId } = await params
  const config = getResource(resource)
  if (!config) notFound()
  const profile = await (config.adminOnly ? requireAdmin() : requireStaff())
  const id = decodeURIComponent(rawId)
  if ((config.primaryKey ?? 'id') === 'id' && !/^[0-9a-f-]{36}$/i.test(id)) notFound()

  const row = await getRecord(config, id)
  if (!row) notFound()
  const query = await searchParams
  const status = config.publishable || config.softDelete ? statusOf(row) : undefined
  const publicPath = await publicPathFor(config, row)

  return (
    <>
      <AdminHeader
        back={{ href: `/admin/${config.key}`, label: config.label }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span className="min-w-0 break-words">{recordTitle(config, row)}</span>
            <StatusBadge status={status} />
          </span>
        }
        description={
          row.updated_at
            ? `Last updated ${formatDateTime(String(row.updated_at))}${row.version ? ` · version ${row.version}` : ''}`
            : undefined
        }
        actions={
          <>
            {publicPath && status === 'live' ? (
              <a
                href={publicPath}
                target="_blank"
                rel="noopener"
                className={buttonClasses('secondary', 'sm')}
              >
                View live ↗
              </a>
            ) : null}
            {config.revisions ? (
              <ButtonLink
                href={`/admin/${config.key}/${encodeURIComponent(id)}/revisions`}
                size="sm"
                variant="secondary"
              >
                History
              </ButtonLink>
            ) : null}
            {config.softDelete && status !== 'deleted' ? (
              <form action={setDeleted.bind(null, config.key, id, true)}>
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center rounded-control px-3 text-small font-medium text-danger hover:bg-danger-soft sm:min-h-9"
                >
                  Move to trash
                </button>
              </form>
            ) : null}
            {status === 'deleted' ? (
              <form action={setDeleted.bind(null, config.key, id, false)}>
                <button type="submit" className={buttonClasses('soft', 'sm')}>
                  Restore
                </button>
              </form>
            ) : null}
          </>
        }
      />

      {query.saved ? <Notice>Created. You can keep editing below.</Notice> : null}
      {query.restored ? <Notice>Restored.</Notice> : null}
      {status === 'deleted' ? (
        <Notice tone="warning">
          This item is in the trash and hidden from the site. Restore it to edit and publish again.
        </Notice>
      ) : null}
      {config.table === 'notes' ? (
        <p className="mb-4 text-small text-muted">
          {Number(row.word_count ?? 0).toLocaleString('en-IN')} words ·{' '}
          {String(row.reading_time_minutes ?? 1)} min read
        </p>
      ) : null}

      <ResourceEditor config={config} row={row} publicPath={publicPath} />

      {/* Bottom padding clears the fixed save bar. */}
      <div className="mt-8 space-y-6 pb-24">
        {config.table === 'assignments' ? <AssignmentQuestions assignmentId={id} /> : null}
        {config.table === 'courses' || config.table === 'weeks' ? (
          <ChildLinks config={config} id={id} />
        ) : null}
        {profile.role === 'admin' && (status === 'deleted' || !config.softDelete) ? (
          <details className="rounded-card border border-danger/30 p-4">
            <summary className="cursor-pointer text-small font-medium text-danger">
              Delete permanently
            </summary>
            <p className="mt-2 text-small text-muted">
              This cannot be undone. Anything that belongs to it (weeks, questions, notes) may be
              deleted too, and its URL will return 404.
            </p>
            <form action={hardDelete.bind(null, config.key, id)} className="mt-3">
              <button
                type="submit"
                className="inline-flex min-h-11 items-center rounded-control bg-danger px-4 text-small font-medium text-white hover:brightness-95 sm:min-h-9"
              >
                Delete forever
              </button>
            </form>
          </details>
        ) : null}
      </div>
    </>
  )
}

async function AssignmentQuestions({ assignmentId }: { assignmentId: string }) {
  const db = await adminDb()
  const { data } = await db
    .from('questions')
    .select('id, position, question_type, question_mdx, marks')
    .eq('assignment_id', assignmentId)
    .is('deleted_at', null)
    .order('position')
  const questions = (data ?? []) as Array<Record<string, unknown>>
  const questionConfig = getResource('questions')!
  const nextPosition = questions.reduce((max, q) => Math.max(max, Number(q.position) || 0), 0) + 1

  return (
    <Panel
      title={`Questions (${questions.length})`}
      actions={
        <div className="flex gap-2">
          <ButtonLink
            href={`/admin/import?kind=questions&target=${assignmentId}`}
            size="sm"
            variant="secondary"
          >
            Bulk import
          </ButtonLink>
          <ButtonLink
            href={`/admin/questions/new?assignment_id=${assignmentId}&position=${nextPosition}`}
            size="sm"
          >
            Add question
          </ButtonLink>
        </div>
      }
    >
      {questions.length === 0 ? (
        <p className="text-small text-muted">
          No questions yet. Add them one by one or paste a CSV/JSON batch with Bulk import.
        </p>
      ) : (
        <Table className="border-0">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Question</th>
              <th scope="col">Type</th>
              <th scope="col">Marks</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => (
              <tr key={String(q.id)}>
                <td className="w-10 tabular-nums">{String(q.position)}</td>
                <td>
                  <Link
                    href={`/admin/questions/${q.id}`}
                    className="text-text hover:text-accent-ink hover:underline"
                  >
                    {displayValue(questionConfig, 'question_mdx', q.question_mdx)}
                  </Link>
                </td>
                <td className="whitespace-nowrap text-muted">
                  {displayValue(questionConfig, 'question_type', q.question_type)}
                </td>
                <td className="text-muted">{q.marks === null ? '—' : String(q.marks)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Panel>
  )
}

async function ChildLinks({ config, id }: { config: ResourceConfig; id: string }) {
  const db = await adminDb()
  const column = config.table === 'courses' ? 'course_id' : 'week_id'
  const children =
    config.table === 'courses'
      ? (['weeks', 'assignments', 'notes'] as const)
      : (['assignments', 'notes'] as const)
  const counts = await Promise.all(
    children.map(async (table) => {
      const { count } = await db
        .from(table)
        .select('id', { count: 'exact', head: true })
        .eq(column, id)
        .is('deleted_at', null)
      return { table, count: count ?? 0 }
    }),
  )
  return (
    <Panel title="Belongs to this">
      <ul className="flex flex-wrap gap-2">
        {counts.map(({ table, count }) => (
          <li key={table}>
            <Link
              href={`/admin/${table}?${column === 'course_id' ? 'course_id' : 'week_id'}=${id}`}
              className={buttonClasses('secondary', 'sm')}
            >
              {getResource(table)?.label} ({count})
            </Link>
          </li>
        ))}
        {children.map((table) => (
          <li key={`new-${table}`}>
            <Link
              href={`/admin/${table}/new?${column}=${id}`}
              className={buttonClasses('ghost', 'sm')}
            >
              + {getResource(table)?.singular}
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
