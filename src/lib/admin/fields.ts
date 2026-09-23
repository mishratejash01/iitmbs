/**
 * Field model for the config-driven admin. Each content table is described by
 * a list of fields (src/lib/admin/resources.ts); the same description drives
 * the list view, the edit form, parsing of submitted values and validation.
 * Pure and shared by server and client code.
 */

export type FieldType =
  | 'text'
  | 'slug'
  | 'url'
  | 'textarea'
  | 'mdx'
  | 'number'
  | 'boolean'
  | 'datetime'
  | 'select'
  | 'reference'
  | 'tags'
  | 'json'
  | 'options'
  | 'sources'
  | 'image'
  | 'file'

export type FieldSection = 'main' | 'content' | 'publishing' | 'seo' | 'source'

export type FieldOption = { value: string; label: string }

export type Field = {
  name: string
  label: string
  type: FieldType
  section?: FieldSection
  required?: boolean
  help?: string
  placeholder?: string
  max?: number
  rows?: number
  options?: FieldOption[]
  /** For "reference": which option list to load (see src/lib/admin/options.ts). */
  reference?: ReferenceKey
  /** Hide in the form (still shown in lists when listed). */
  readOnly?: boolean
  /** Store a select's value as a number or boolean instead of text. */
  coerce?: 'number' | 'boolean'
}

export type ReferenceKey = 'programs' | 'courses' | 'weeks' | 'assignments' | 'authors' | 'faqScopes'

const IST_OFFSET_MINUTES = 330

/** ISO timestamp → value for <input type="datetime-local"> in IST. */
export function toIstInput(iso: string | null | undefined): string {
  if (!iso) return ''
  const date = new Date(Date.parse(iso) + IST_OFFSET_MINUTES * 60_000)
  return date.toISOString().slice(0, 16)
}

/** "2026-10-02T23:59" entered in IST → ISO timestamp with offset. */
export function fromIstInput(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null
  return `${value}:00+05:30`
}

export function parseTags(value: string): string[] {
  return [
    ...new Set(
      value
        .split(/[\n,]/)
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ]
}

export type ParseResult = { ok: true; value: unknown } | { ok: false; error: string }

/** Converts one submitted form value to the column value. */
export function parseFieldValue(field: Field, raw: FormDataEntryValue | null): ParseResult {
  const text = typeof raw === 'string' ? raw.trim() : ''
  const empty = text === ''

  switch (field.type) {
    case 'boolean':
      return { ok: true, value: raw === 'on' || raw === 'true' }
    case 'number': {
      if (empty) return field.required ? { ok: false, error: 'Required' } : { ok: true, value: null }
      const n = Number(text)
      return Number.isFinite(n) ? { ok: true, value: n } : { ok: false, error: 'Must be a number' }
    }
    case 'datetime': {
      if (empty) return field.required ? { ok: false, error: 'Required' } : { ok: true, value: null }
      const iso = fromIstInput(text)
      return iso ? { ok: true, value: iso } : { ok: false, error: 'Invalid date and time' }
    }
    case 'tags':
      return { ok: true, value: parseTags(text) }
    case 'json':
    case 'options':
    case 'sources': {
      if (empty) {
        const fallback = field.type === 'json' ? {} : []
        return field.required ? { ok: false, error: 'Required' } : { ok: true, value: fallback }
      }
      try {
        return { ok: true, value: JSON.parse(text) }
      } catch {
        return { ok: false, error: 'Invalid JSON' }
      }
    }
    case 'slug':
      if (empty) return field.required ? { ok: false, error: 'Required' } : { ok: true, value: null }
      return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(text)
        ? { ok: true, value: text }
        : { ok: false, error: 'Lowercase letters, digits and single hyphens only' }
    case 'url':
      if (empty) return field.required ? { ok: false, error: 'Required' } : { ok: true, value: null }
      return /^(https:\/\/|\/|mailto:)/.test(text)
        ? { ok: true, value: text }
        : { ok: false, error: 'Use an https:// URL or a path starting with /' }
    case 'mdx':
    case 'textarea':
      // Keep inner whitespace for long-form text.
      if (typeof raw !== 'string' || raw.trim() === '') {
        return field.required ? { ok: false, error: 'Required' } : { ok: true, value: field.type === 'mdx' ? '' : null }
      }
      if (field.max && raw.length > field.max) return { ok: false, error: `At most ${field.max} characters` }
      return { ok: true, value: raw.replace(/\r\n/g, '\n') }
    default:
      if (empty) return field.required ? { ok: false, error: 'Required' } : { ok: true, value: null }
      if (field.max && text.length > field.max) return { ok: false, error: `At most ${field.max} characters` }
      if (field.type === 'select' && field.options && !field.options.some((o) => o.value === text)) {
        return { ok: false, error: 'Choose one of the options' }
      }
      if (field.coerce === 'number') return { ok: true, value: Number(text) }
      if (field.coerce === 'boolean') return { ok: true, value: text === 'true' }
      return { ok: true, value: text }
  }
}

/** Serialises a column value for a form input. */
export function toInputValue(field: Field, value: unknown): string {
  if (value === null || value === undefined) return ''
  switch (field.type) {
    case 'datetime':
      return toIstInput(String(value))
    case 'tags':
      return Array.isArray(value) ? value.join(', ') : ''
    case 'json':
    case 'options':
    case 'sources':
      return JSON.stringify(value, null, 2)
    case 'boolean':
      return value ? 'true' : ''
    default:
      return String(value)
  }
}
