import { notFound } from 'next/navigation'

import { ResourceEditor } from '@/components/admin/resource-editor'
import { AdminHeader } from '@/components/admin/ui'
import { getResource } from '@/lib/admin/resources'
import { requireAdmin, requireStaff } from '@/lib/auth/session'

// Staff-only and always fresh: renders on request, never from a prefetch.
export const instant = false

export default async function NewRecordPage({
  params,
  searchParams,
}: PageProps<'/admin/[resource]/new'>) {
  const { resource } = await params
  const config = getResource(resource)
  if (!config || config.key === 'media') notFound()
  await (config.adminOnly ? requireAdmin() : requireStaff())

  // Links such as "Add question" pass the parent in the query string.
  const query = await searchParams
  const prefill: Record<string, string> = {}
  for (const field of config.fields) {
    const value = query[field.name]
    if (
      typeof value === 'string' &&
      value &&
      (field.type === 'reference' || field.type === 'select' || field.type === 'number')
    ) {
      prefill[field.name] = value
    }
  }

  return (
    <>
      <AdminHeader
        title={`New ${config.singular.toLowerCase()}`}
        back={{ href: `/admin/${config.key}`, label: config.label }}
      />
      <ResourceEditor config={config} row={null} prefill={prefill} />
      <div className="h-24" aria-hidden="true" />
    </>
  )
}
