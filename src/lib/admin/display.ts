import { mdxToPlainText, truncate } from '@/lib/mdx/plain'
import { formatDate, formatDateTime } from '@/lib/utils/dates'

import type { Field } from './fields'
import type { ResourceConfig } from './resources'

const SYSTEM_LABELS: Record<string, string> = {
  updated_at: 'Updated',
  created_at: 'Created',
  download_count: 'Downloads',
  status: 'Status',
}

export function columnLabel(config: ResourceConfig, column: string): string {
  return config.fields.find((f) => f.name === column)?.label ?? SYSTEM_LABELS[column] ?? column
}

/** A short, readable rendering of a column value for list views. */
export function displayValue(config: ResourceConfig, column: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  const field: Field | undefined = config.fields.find((f) => f.name === column)
  if (column === 'updated_at' || column === 'created_at') return formatDate(String(value))
  if (field?.type === 'datetime') return formatDateTime(String(value))
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (field?.type === 'mdx') return truncate(mdxToPlainText(String(value)), 90)
  if (field?.type === 'select')
    return field.options?.find((o) => o.value === String(value))?.label ?? String(value)
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

/** The record's name as shown in headings and breadcrumbs. */
export function recordTitle(config: ResourceConfig, row: Record<string, unknown>): string {
  const value = row[config.titleColumn]
  if (typeof value !== 'string' || !value.trim()) return `Untitled ${config.singular.toLowerCase()}`
  return config.fields.find((f) => f.name === config.titleColumn)?.type === 'mdx'
    ? truncate(mdxToPlainText(value), 80)
    : value
}
