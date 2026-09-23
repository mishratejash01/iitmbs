import { saveRecord } from '@/app/admin/actions'
import { env } from '@/env'
import { toInputValue, type ReferenceKey } from '@/lib/admin/fields'
import { loadReferenceOptions } from '@/lib/admin/options'
import type { ResourceConfig } from '@/lib/admin/resources'
import { getSiteSettings } from '@/lib/data/settings'

import { ResourceForm } from './resource-form'

/** Loads option lists and initial values, then renders the client form. */
export async function ResourceEditor({
  config,
  row,
  prefill = {},
  publicPath = null,
}: {
  config: ResourceConfig
  row: Record<string, unknown> | null
  prefill?: Record<string, string>
  publicPath?: string | null
}) {
  const references = [
    ...new Set(config.fields.flatMap((f) => (f.reference ? [f.reference] : []))),
  ] as ReferenceKey[]
  const [options, settings] = await Promise.all([
    loadReferenceOptions(references),
    getSiteSettings(),
  ])

  const values: Record<string, string> = {}
  for (const field of config.fields) {
    if (row) values[field.name] = toInputValue(field, row[field.name])
    else if (prefill[field.name] !== undefined) values[field.name] = prefill[field.name]!
  }
  const id = row ? String(row[config.primaryKey ?? 'id']) : null

  return (
    <ResourceForm
      // Remount when switching records so uncontrolled fields reset.
      key={id ?? 'new'}
      config={config}
      values={values}
      options={options}
      action={saveRecord.bind(null, config.key, id)}
      isNew={!row}
      siteName={settings.site_name}
      siteOrigin={env.siteUrl}
      publicPath={publicPath}
    />
  )
}
