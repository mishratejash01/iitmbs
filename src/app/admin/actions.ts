'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { after } from 'next/server'
import { z } from 'zod'

import { parseCsv } from '@/lib/admin/csv'
import { parseFieldValue } from '@/lib/admin/fields'
import { renderMdxPreview, type MdxPreview } from '@/lib/admin/preview'
import { checkQuality, type QualityWarning } from '@/lib/admin/quality'
import { publicPathFor } from '@/lib/admin/paths'
import { adminDb, getRecord, hasDuplicateTitle } from '@/lib/admin/records'
import { getResource, isPublicTable, type ResourceConfig } from '@/lib/admin/resources'
import { getCurrentProfile, type Profile } from '@/lib/auth/session'
import { getSiteSettings } from '@/lib/data/settings'
import { processMdx } from '@/lib/mdx/process'
import { pingIndexNow } from '@/lib/publishing/indexnow'
import { revalidateTables } from '@/lib/publishing/revalidate'
import { parseSiteSettings } from '@/lib/settings/schema'

export type SaveState = {
  status: 'idle' | 'saved' | 'error' | 'warnings'
  message?: string
  errors?: Record<string, string>
  warnings?: QualityWarning[]
}

const SEARCHABLE = new Set([
  'programs',
  'courses',
  'weeks',
  'assignments',
  'notes',
  'faqs',
  'pages',
  'resources',
  'blog_posts',
  'blog_categories',
  'note_courses',
])

async function staff(adminOnly = false): Promise<Profile | null> {
  const profile = await getCurrentProfile()
  if (!profile || (profile.role !== 'editor' && profile.role !== 'admin')) return null
  if (adminOnly && profile.role !== 'admin') return null
  return profile
}

async function afterWrite(
  config: ResourceConfig,
  row: Record<string, unknown>,
  options: { immediate: boolean },
) {
  if (!isPublicTable(config.table)) return
  const tables: string[] = [config.table]
  if (config.table === 'questions') tables.push('assignments')
  revalidateTables(tables, { immediate: options.immediate })
  if (SEARCHABLE.has(config.table)) {
    const db = await adminDb()
    await db.rpc('staff_refresh_search_index')
  }
  const settings = await getSiteSettings()
  if (row.is_published && settings.content.indexnow_enabled) {
    const path = await publicPathFor(config, row)
    if (path) after(() => pingIndexNow([path]).then(() => undefined))
  }
}

export async function saveRecord(
  resourceKey: string,
  id: string | null,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const config = getResource(resourceKey)
  if (!config) return { status: 'error', message: 'Unknown resource.' }
  if (!(await staff(config.adminOnly)))
    return { status: 'error', message: 'You do not have permission to edit this.' }

  const payload: Record<string, unknown> = {}
  const errors: Record<string, string> = {}
  for (const field of config.fields) {
    if (field.readOnly && id) continue
    const result = parseFieldValue(field, formData.get(field.name))
    if (result.ok) payload[field.name] = result.value
    else errors[field.name] = result.error
  }
  if (config.table === 'faqs') {
    if (payload.scope === 'global') payload.scope_id = null
    else if (!payload.scope_id) errors.scope_id = 'Choose which page this FAQ belongs to'
  }
  if (
    config.table === 'assignments' &&
    typeof payload.term === 'string' &&
    !/^\d{4}-(jan|may|sep)$/.test(payload.term)
  ) {
    errors.term = 'Use YYYY-jan, YYYY-may or YYYY-sep'
  }
  if (Object.keys(errors).length > 0)
    return { status: 'error', message: 'Please fix the highlighted fields.', errors }

  const existing = id ? await getRecord(config, id) : null
  if (id && !existing) return { status: 'error', message: 'This item no longer exists.' }

  // Quality gate: on publish (or whenever MDX is broken), warn and require acknowledgement.
  const mdxFields = config.fields.filter(
    (f) => f.type === 'mdx' && typeof payload[f.name] === 'string' && payload[f.name],
  )
  const mdxProblems: Array<{ field: string; message: string }> = []
  for (const field of mdxFields) {
    const processed = await processMdx(String(payload[field.name]))
    if (processed.error)
      mdxProblems.push({
        field: field.name,
        message: `${field.label}: not valid MDX (shown as plain Markdown). ${processed.error.slice(0, 160)}`,
      })
    const report = processed.report
    if (
      report &&
      (report.removedEsm ||
        report.removedExpressions ||
        report.unwrappedElements.length ||
        report.droppedAttributes.length)
    ) {
      mdxProblems.push({
        field: field.name,
        message: `${field.label}: some MDX was removed for safety (expressions, imports or unknown components).`,
      })
    }
  }
  const publishing = Boolean(config.publishable && payload.is_published)
  if ((publishing || mdxProblems.length > 0) && formData.get('acknowledge_warnings') !== 'on') {
    const settings = await getSiteSettings()
    const warnings = publishing
      ? checkQuality({
          config,
          record: payload,
          minWords: settings.content.min_words_warning,
          duplicateTitle: await hasDuplicateTitle(config, payload[config.titleColumn], id),
          mdxProblems,
        })
      : mdxProblems.map((p) => ({ code: 'mdx', field: p.field, message: p.message }))
    if (warnings.length > 0) {
      return {
        status: 'warnings',
        message: 'Review these before saving — tick “Save anyway” to continue.',
        warnings,
      }
    }
  }

  const db = await adminDb()
  const key = config.primaryKey ?? 'id'
  const query = id
    ? db.from(config.table).update(payload).eq(key, id).select('*').single()
    : db.from(config.table).insert(payload).select('*').single()
  const { data, error } = await query
  if (error || !data) {
    if (error?.message.includes('duplicate key')) {
      const unique = config.fields.find(
        (f) => f.type === 'slug' || ['path', 'from_path', 'name', 'public_id'].includes(f.name),
      )
      return {
        status: 'error',
        message: 'Another item already uses this slug or path in the same place.',
        errors: unique ? { [unique.name]: 'Already in use — choose another' } : undefined,
      }
    }
    const message = error?.message.includes('check constraint')
      ? `A validation rule failed: ${error.message}`
      : `Could not save: ${error?.message ?? 'unknown error'}`
    return { status: 'error', message }
  }

  const row = data as Record<string, unknown>
  // Unpublishing, or moving a release later, must take effect immediately.
  const immediate =
    (existing?.is_published === true && row.is_published === false) ||
    (existing?.solutions_release_at !== undefined &&
      existing.solutions_release_at !== row.solutions_release_at)
  await afterWrite(config, row, { immediate })

  if (!id) redirect(`/admin/${config.key}/${encodeURIComponent(String(row[key]))}?saved=1`)
  return { status: 'saved', message: publishing ? 'Saved and published.' : 'Saved.' }
}

export async function setDeleted(resourceKey: string, id: string, deleted: boolean) {
  const config = getResource(resourceKey)
  if (!config?.softDelete || !(await staff(config.adminOnly))) return
  const db = await adminDb()
  const { data } = await db
    .from(config.table)
    .update({ deleted_at: deleted ? new Date().toISOString() : null })
    .eq('id', id)
    .select('*')
    .single()
  if (data) await afterWrite(config, data as Record<string, unknown>, { immediate: deleted })
  redirect(`/admin/${config.key}${deleted ? '?deleted=1' : `/${id}?restored=1`}`)
}

export async function hardDelete(resourceKey: string, id: string) {
  const config = getResource(resourceKey)
  if (!config || !(await staff(true))) return
  const db = await adminDb()
  await db
    .from(config.table)
    .delete()
    .eq(config.primaryKey ?? 'id', id)
  if (isPublicTable(config.table)) revalidateTables([config.table], { immediate: true })
  redirect(`/admin/${config.key}?deleted=1`)
}

export async function previewMdx(source: string): Promise<MdxPreview> {
  if (!(await staff())) return { html: '', error: 'Not allowed', removed: [] }
  return renderMdxPreview(source.slice(0, 200_000))
}

const mediaSchema = z.object({
  public_id: z.string().min(1).max(255),
  resource_type: z.enum(['image', 'raw', 'video']),
  delivery_type: z.enum(['upload', 'authenticated']),
  format: z.string().max(16).nullable().optional(),
  width: z.number().int().positive().nullable().optional(),
  height: z.number().int().positive().nullable().optional(),
  bytes: z.number().int().nonnegative().nullable().optional(),
  alt_text: z.string().trim().max(300).nullable().optional(),
})

/** Records an upload in the media library (alt text required for images). */
export async function registerMedia(
  input: z.infer<typeof mediaSchema>,
): Promise<{ ok: boolean; message?: string }> {
  if (!(await staff())) return { ok: false, message: 'Not allowed' }
  const parsed = mediaSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: 'Invalid upload details' }
  if (parsed.data.resource_type === 'image' && !parsed.data.alt_text)
    return { ok: false, message: 'Alt text is required for images.' }
  const db = await adminDb()
  const { error } = await db
    .from('media')
    .upsert({ ...parsed.data, source_permission: 'original' }, { onConflict: 'public_id' })
  if (error) return { ok: false, message: error.message }
  revalidateTables(['media'])
  return { ok: true }
}

export async function restoreRevision(resourceKey: string, id: string, revisionId: number) {
  const config = getResource(resourceKey)
  if (!config?.revisions || !(await staff())) return
  const db = await adminDb()
  const { data: revision } = await db
    .from('content_revisions')
    .select('snapshot')
    .eq('id', revisionId)
    .eq('record_id', id)
    .maybeSingle()
  if (!revision) return
  const snapshot = revision.snapshot as Record<string, unknown>
  const payload = Object.fromEntries(
    config.fields.filter((f) => !f.readOnly).map((f) => [f.name, snapshot[f.name] ?? null]),
  )
  const { data } = await db.from(config.table).update(payload).eq('id', id).select('*').single()
  if (data) await afterWrite(config, data as Record<string, unknown>, { immediate: true })
  redirect(`/admin/${config.key}/${id}?restored=1`)
}

export async function saveSettings(_prev: SaveState, formData: FormData): Promise<SaveState> {
  if (!(await staff(true)))
    return { status: 'error', message: 'Only admins can change site settings.' }
  let raw: unknown
  try {
    raw = JSON.parse(String(formData.get('settings_json') ?? '{}'))
  } catch {
    return { status: 'error', message: 'Settings could not be read.' }
  }
  const settings = parseSiteSettings(raw)
  // Invalid values fall back to defaults while parsing; tell the admin which.
  const reset = changedPaths(raw, settings)
  const db = await adminDb()
  const { error } = await db.from('site_settings').upsert({ id: true, data: settings })
  if (error) return { status: 'error', message: error.message }
  revalidateTables(['site_settings'], { immediate: true })
  return {
    status: 'saved',
    message: 'Settings saved. Pages refresh with the new values on their next visit.',
    warnings: reset.map((path) => ({
      code: 'reset',
      field: path,
      message: `${path} was not valid and was reset to its default.`,
    })),
  }
}

/** Leaf paths present in `input` whose value differs after validation. */
function changedPaths(input: unknown, output: unknown, prefix = ''): string[] {
  if (
    input &&
    typeof input === 'object' &&
    !Array.isArray(input) &&
    output &&
    typeof output === 'object' &&
    !Array.isArray(output)
  ) {
    return Object.entries(input as Record<string, unknown>).flatMap(([key, value]) =>
      key in (output as Record<string, unknown>)
        ? changedPaths(
            value,
            (output as Record<string, unknown>)[key],
            prefix ? `${prefix}.${key}` : key,
          )
        : [],
    )
  }
  return JSON.stringify(input) === JSON.stringify(output) ? [] : [prefix]
}

export async function setUserRole(formData: FormData) {
  if (!(await staff(true))) return
  const userId = String(formData.get('user_id') ?? '')
  const role = String(formData.get('role') ?? '')
  const back = String(formData.get('back') ?? '/admin/users')
  const target = back.startsWith('/admin/users') ? back : '/admin/users'
  const join = target.includes('?') ? '&' : '?'
  if (!z.uuid().safeParse(userId).success || !['student', 'editor', 'admin'].includes(role)) {
    redirect(`${target}${join}error=invalid`)
  }
  const db = await adminDb()
  const { error } = await db.rpc('admin_set_user_role', { p_user_id: userId, p_role: role })
  redirect(
    `${target}${join}${error ? (error.message.includes('demote') ? 'error=self' : 'error=failed') : 'updated=1'}`,
  )
}

export async function setFeedbackStatus(id: string, status: 'new' | 'reviewed' | 'archived') {
  const profile = await staff()
  if (!profile) return
  const db = await adminDb()
  await db
    .from('content_feedback')
    .update({
      status,
      reviewed_at: status === 'new' ? null : new Date().toISOString(),
      reviewed_by: status === 'new' ? null : profile.id,
    })
    .eq('id', id)
  revalidatePath('/admin/feedback')
}

export async function refreshRollups(formData: FormData) {
  if (!(await staff(true))) return
  const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  const from = day.safeParse(formData.get('from'))
  const to = day.safeParse(formData.get('to'))
  const back = String(formData.get('back') ?? '')
  const target = back.startsWith('/admin/analytics') ? back : '/admin/analytics'
  let status = 'refreshed=1'
  if (from.success && to.success && from.data <= to.data) {
    // Recomputes the daily rollups for the range shown (the RPC caps it at 400 days).
    const db = await adminDb()
    const { error } = await db.rpc('admin_refresh_rollups', { p_from: from.data, p_to: to.data })
    if (error) status = 'refresh_error=1'
  } else {
    status = 'refresh_error=1'
  }
  redirect(`${target}${target.includes('?') ? '&' : '?'}${status}`)
}

// ── Bulk import ──────────────────────────────────────────────────────────────

export type ImportState = {
  status: 'idle' | 'done' | 'error'
  message?: string
  rowErrors?: string[]
}

const permission = z.enum(['original', 'permission_granted', 'official_link'], {
  error: 'source_permission must be original, permission_granted or official_link',
})
const list = (value: unknown) =>
  Array.isArray(value)
    ? value.map(String)
    : typeof value === 'string' && value
      ? value
          .split(/[;|]/)
          .map((v) => v.trim())
          .filter(Boolean)
      : []
const jsonish = (value: unknown) => {
  if (typeof value !== 'string') return value ?? null
  if (!value.trim()) return null
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

const questionRow = z.object({
  position: z.coerce.number().int().min(1).max(500),
  question_type: z.enum(['mcq', 'msq', 'numeric', 'text']),
  question_mdx: z.string().min(1),
  options: z.unknown().optional(),
  hint_mdx: z.string().optional(),
  answer_mdx: z.string().optional(),
  explanation_mdx: z.string().optional(),
  answer_key: z.unknown().optional(),
  concept_tags: z.unknown().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional().or(z.literal('')),
  marks: z.coerce.number().optional().or(z.literal('')),
  source_permission: permission,
  source_url: z.string().optional(),
})

const weekRow = z.object({
  week_number: z.coerce.number().int().min(1).max(16),
  title: z.string().min(2).max(160),
  summary: z.string().max(1000).optional(),
  topics: z.unknown().optional(),
  source_permission: permission,
})

function toOptions(value: unknown) {
  const parsed = jsonish(value)
  if (Array.isArray(parsed)) return parsed
  // "a) 2|b) 3" or "2|3|4" → [{id:"a",label_mdx:"2"}, …]
  return list(value).map((label, index) => ({
    id: String.fromCharCode(97 + index),
    label_mdx: label.replace(/^[a-z]\)\s*/i, ''),
  }))
}

export async function importRows(_prev: ImportState, formData: FormData): Promise<ImportState> {
  if (!(await staff())) return { status: 'error', message: 'Not allowed.' }
  const kind = formData.get('kind')
  const targetId = String(formData.get('target_id') ?? '')
  const text = String(formData.get('data') ?? '').trim()
  if (!text) return { status: 'error', message: 'Paste JSON or CSV data first.' }
  if (!z.uuid().safeParse(targetId).success)
    return { status: 'error', message: 'Choose where to import to.' }

  let rows: Array<Record<string, unknown>>
  try {
    rows = text.startsWith('[')
      ? (JSON.parse(text) as Array<Record<string, unknown>>)
      : parseCsv(text)
  } catch {
    return { status: 'error', message: 'Could not parse the data as JSON or CSV.' }
  }
  if (!Array.isArray(rows) || rows.length === 0)
    return { status: 'error', message: 'No rows found.' }
  if (rows.length > 500) return { status: 'error', message: 'Import at most 500 rows at a time.' }

  const rowErrors: string[] = []
  const records: Array<Record<string, unknown>> = []
  rows.forEach((row, index) => {
    const schema = kind === 'weeks' ? weekRow : questionRow
    const parsed = schema.safeParse(row)
    if (!parsed.success) {
      rowErrors.push(
        `Row ${index + 1}: ${parsed.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join('; ')}`,
      )
      return
    }
    if (kind === 'weeks') {
      const w = parsed.data as z.infer<typeof weekRow>
      records.push({
        course_id: targetId,
        week_number: w.week_number,
        title: w.title,
        summary: w.summary || null,
        topics: list(w.topics),
      })
    } else {
      const q = parsed.data as z.infer<typeof questionRow>
      records.push({
        assignment_id: targetId,
        position: q.position,
        question_type: q.question_type,
        question_mdx: q.question_mdx,
        options: toOptions(q.options),
        hint_mdx: q.hint_mdx || null,
        answer_mdx: q.answer_mdx || null,
        explanation_mdx: q.explanation_mdx || null,
        answer_key: jsonish(q.answer_key),
        concept_tags: list(q.concept_tags),
        difficulty: q.difficulty || null,
        marks: q.marks === '' || q.marks === undefined ? null : q.marks,
        source_permission: q.source_permission,
        source_url: q.source_url || null,
      })
    }
  })
  if (rowErrors.length > 0)
    return { status: 'error', message: 'Nothing was imported — fix these rows first.', rowErrors }

  const db = await adminDb()
  const table = kind === 'weeks' ? 'weeks' : 'questions'
  const { error } = await db.from(table).insert(records)
  if (error) return { status: 'error', message: `Import failed: ${error.message}` }
  revalidateTables(table === 'questions' ? ['questions', 'assignments'] : ['weeks'])
  return { status: 'done', message: `Imported ${records.length} ${table}.` }
}
