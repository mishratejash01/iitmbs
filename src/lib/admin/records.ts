import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

import { createSupabaseServerClient } from '@/lib/supabase/server'

import type { ResourceConfig } from './resources'

export type RecordStatus = 'draft' | 'scheduled' | 'live' | 'deleted'
export type AdminRow = Record<string, unknown> & { __status?: RecordStatus }

/** An untyped view of the staff member's client for config-driven tables. */
export async function adminDb(): Promise<SupabaseClient> {
  return (await createSupabaseServerClient()) as unknown as SupabaseClient
}

export function statusOf(row: Record<string, unknown>): RecordStatus {
  if (row.deleted_at) return 'deleted'
  if (row.is_published === false) return 'draft'
  if (typeof row.published_at === 'string' && Date.parse(row.published_at) > Date.now()) return 'scheduled'
  return 'live'
}

const PAGE_SIZE = 50

/** Search, status filter and pagination for a resource list. */
export async function listRecords(
  config: ResourceConfig,
  options: { q?: string; status?: string; page?: number; filter?: Record<string, string> },
): Promise<{ rows: AdminRow[]; total: number; pageSize: number }> {
  const db = await adminDb()
  const key = config.primaryKey ?? 'id'
  const columns = new Set([key, config.titleColumn, ...config.listColumns.filter((c) => c !== 'status')])
  if (config.publishable) ['is_published', 'published_at'].forEach((c) => columns.add(c))
  if (config.softDelete) columns.add('deleted_at')

  let query = db.from(config.table).select([...columns].join(', '), { count: 'exact' })

  const q = options.q?.replace(/[,()%*\\]/g, ' ').trim()
  if (q) query = query.or(config.searchColumns.map((c) => `${c}.ilike.%${q}%`).join(','))
  for (const [column, value] of Object.entries(options.filter ?? {})) {
    if (config.fields.some((f) => f.name === column) && value) query = query.eq(column, value)
  }

  const now = new Date().toISOString()
  if (config.softDelete) {
    if (options.status === 'deleted') query = query.not('deleted_at', 'is', null)
    else query = query.is('deleted_at', null)
  }
  if (config.publishable) {
    if (options.status === 'draft') query = query.eq('is_published', false)
    if (options.status === 'scheduled') query = query.eq('is_published', true).gt('published_at', now)
    if (options.status === 'live') query = query.eq('is_published', true).lte('published_at', now)
  }

  const page = Math.max(1, options.page ?? 1)
  const { data, count, error } = await query
    .order(config.orderBy.column, { ascending: config.orderBy.ascending })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
  if (error) throw new Error(error.message)

  const rows = ((data ?? []) as unknown as Array<Record<string, unknown>>).map((row) => ({
    ...row,
    __status: config.publishable || config.softDelete ? statusOf(row) : undefined,
  }))
  return { rows, total: count ?? rows.length, pageSize: PAGE_SIZE }
}

export async function getRecord(config: ResourceConfig, id: string): Promise<AdminRow | null> {
  const db = await adminDb()
  const { data, error } = await db
    .from(config.table)
    .select('*')
    .eq(config.primaryKey ?? 'id', id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return (data as AdminRow | null) ?? null
}

/** Whether another live row of the same table already uses this title. */
export async function hasDuplicateTitle(config: ResourceConfig, title: unknown, id: string | null): Promise<boolean> {
  if (typeof title !== 'string' || !title.trim() || config.titleColumn === 'question_mdx') return false
  const db = await adminDb()
  let query = db.from(config.table).select(config.primaryKey ?? 'id').eq(config.titleColumn, title.trim()).limit(1)
  if (config.softDelete) query = query.is('deleted_at', null)
  if (id) query = query.neq(config.primaryKey ?? 'id', id)
  const { data } = await query
  return (data ?? []).length > 0
}
