import { ImportForm } from '@/components/admin/import-form'
import { AdminHeader } from '@/components/admin/ui'
import { loadReferenceOptions } from '@/lib/admin/options'
import { requireStaff } from '@/lib/auth/session'

// Staff-only and always fresh: renders on request, never from a prefetch.
export const instant = false

export default async function ImportPage({ searchParams }: PageProps<'/admin/import'>) {
  await requireStaff()
  const query = await searchParams
  const kind = query.kind === 'weeks' ? 'weeks' : 'questions'
  const target = typeof query.target === 'string' ? query.target : ''
  const options = await loadReferenceOptions(['assignments', 'courses'])

  return (
    <>
      <AdminHeader
        title="Bulk import"
        description="Paste a spreadsheet export (CSV) or JSON to add many questions or weeks at once. Every row is validated before anything is saved."
      />
      <ImportForm
        assignments={options.assignments ?? []}
        courses={options.courses ?? []}
        initialKind={kind}
        initialTarget={target}
      />
    </>
  )
}
