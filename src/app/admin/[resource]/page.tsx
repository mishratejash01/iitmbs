import Link from 'next/link'
import { notFound } from 'next/navigation'

import { MediaUploader } from '@/components/admin/media-uploader'
import { AdminHeader, Notice, StatusBadge, Table, inputClasses } from '@/components/admin/ui'
import { ButtonLink, buttonClasses } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { columnLabel, displayValue, recordTitle } from '@/lib/admin/display'
import type { Field, ReferenceKey } from '@/lib/admin/fields'
import { loadReferenceOptions } from '@/lib/admin/options'
import { listRecords } from '@/lib/admin/records'
import { getResource } from '@/lib/admin/resources'
import { requireAdmin, requireStaff } from '@/lib/auth/session'
import { cloudinaryImageUrl } from '@/lib/cloudinary/url'

// Staff-only and always fresh: renders on request, never from a prefetch.
export const instant = false

const FILTER_REFERENCES: ReferenceKey[] = [
  'programs',
  'courses',
  'weeks',
  'assignments',
  'blogCategories',
  'noteCourses',
]
const FILTER_SELECTS = new Set([
  'type',
  'kind',
  'scope',
  'location',
  'category',
  'question_type',
  'template',
])

const one = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value) ?? ''

export default async function ResourceListPage({
  params,
  searchParams,
}: PageProps<'/admin/[resource]'>) {
  const { resource } = await params
  const config = getResource(resource)
  if (!config) notFound()
  await (config.adminOnly ? requireAdmin() : requireStaff())

  const query = await searchParams
  const q = one(query.q)
  const status = one(query.status)
  const page = Math.max(1, Number(one(query.page)) || 1)

  const filterFields = config.fields.filter(
    (f): f is Field =>
      (f.type === 'reference' && FILTER_REFERENCES.includes(f.reference as ReferenceKey)) ||
      (f.type === 'select' && FILTER_SELECTS.has(f.name)),
  )
  const filter = Object.fromEntries(
    filterFields.map((f) => [f.name, one(query[f.name])]).filter(([, v]) => v),
  )

  const [{ rows, total, pageSize }, options] = await Promise.all([
    listRecords(config, { q, status, page, filter }),
    loadReferenceOptions(filterFields.flatMap((f) => (f.reference ? [f.reference] : []))),
  ])
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const key = config.primaryKey ?? 'id'

  const pageHref = (next: number) => {
    const search = new URLSearchParams()
    for (const [name, value] of Object.entries(query)) {
      const v = one(value)
      if (v && name !== 'page' && name !== 'deleted') search.set(name, v)
    }
    if (next > 1) search.set('page', String(next))
    const s = search.toString()
    return `/admin/${config.key}${s ? `?${s}` : ''}`
  }
  const newHref = `/admin/${config.key}/new${Object.keys(filter).length ? `?${new URLSearchParams(filter)}` : ''}`

  return (
    <>
      <AdminHeader
        title={config.label}
        description={`${total} ${total === 1 ? 'item' : 'items'}${q ? ` matching “${q}”` : ''}`}
        actions={
          config.key === 'media' ? null : (
            <ButtonLink href={newHref} size="sm">
              New {config.singular.toLowerCase()}
            </ButtonLink>
          )
        }
      />
      {one(query.deleted) ? <Notice>Done — the item was removed.</Notice> : null}
      {config.key === 'media' ? <MediaUploader /> : null}

      <form method="get" className="mb-4 flex flex-wrap items-end gap-2" role="search">
        <div className="min-w-48 flex-1">
          <label htmlFor="admin-q" className="text-xs font-medium text-muted">
            Search
          </label>
          <input
            id="admin-q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder={`Search ${config.label.toLowerCase()}`}
            className={inputClasses}
          />
        </div>
        {config.publishable || config.softDelete ? (
          <div>
            <label htmlFor="admin-status" className="text-xs font-medium text-muted">
              Status
            </label>
            <select id="admin-status" name="status" defaultValue={status} className={inputClasses}>
              <option value="">All</option>
              {config.publishable ? (
                <>
                  <option value="live">Live</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="draft">Draft</option>
                </>
              ) : null}
              {config.softDelete ? <option value="deleted">Deleted</option> : null}
            </select>
          </div>
        ) : null}
        {filterFields.map((field) => {
          const choices =
            field.type === 'reference'
              ? (options[field.reference as ReferenceKey] ?? [])
              : (field.options ?? [])
          return (
            <div key={field.name} className="max-w-72">
              <label htmlFor={`filter-${field.name}`} className="text-xs font-medium text-muted">
                {field.label}
              </label>
              <select
                id={`filter-${field.name}`}
                name={field.name}
                defaultValue={one(query[field.name])}
                className={inputClasses}
              >
                <option value="">All</option>
                {choices.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          )
        })}
        <button type="submit" className={buttonClasses('secondary', 'sm')}>
          Apply
        </button>
      </form>

      {rows.length === 0 ? (
        <EmptyState
          title={
            q || status || Object.keys(filter).length
              ? 'Nothing matches these filters'
              : `No ${config.label.toLowerCase()} yet`
          }
          description={
            config.key === 'media' ? 'Upload an image above to add it to the library.' : undefined
          }
          action={
            config.key === 'media' ? null : (
              <ButtonLink href={newHref} size="sm" variant="secondary">
                New {config.singular.toLowerCase()}
              </ButtonLink>
            )
          }
        />
      ) : (
        <Table>
          <thead>
            <tr>
              {config.key === 'media' ? <th scope="col">Preview</th> : null}
              {config.listColumns.map((column) => (
                <th key={column} scope="col">
                  {columnLabel(config, column)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const href = `/admin/${config.key}/${encodeURIComponent(String(row[key]))}`
              return (
                <tr key={String(row[key])} className="hover:bg-surface">
                  {config.key === 'media' ? (
                    <td className="w-20">
                      {row.resource_type === 'image' ? (
                        // eslint-disable-next-line @next/next/no-img-element -- tiny admin thumbnail straight from Cloudinary
                        <img
                          src={cloudinaryImageUrl(String(row.public_id), {
                            width: 120,
                            height: 80,
                            crop: 'fill',
                          })}
                          alt=""
                          width={60}
                          height={40}
                          className="rounded border border-border object-cover"
                        />
                      ) : (
                        <span className="text-xs text-muted">{String(row.resource_type)}</span>
                      )}
                    </td>
                  ) : null}
                  {config.listColumns.map((column, index) => (
                    <td
                      key={column}
                      className={index === 0 ? 'min-w-56' : 'whitespace-nowrap text-muted'}
                    >
                      {column === 'status' ? (
                        <StatusBadge status={row.__status} />
                      ) : index === 0 ? (
                        <Link
                          href={href}
                          className="font-medium text-text hover:text-accent-ink hover:underline"
                        >
                          {column === config.titleColumn
                            ? recordTitle(config, row)
                            : displayValue(config, column, row[column])}
                        </Link>
                      ) : (
                        displayValue(config, column, row[column])
                      )}
                    </td>
                  ))}
                </tr>
              )
            })}
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
