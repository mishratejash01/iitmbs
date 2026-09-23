'use client'

import { useId, useMemo, useRef, useState } from 'react'

import { registerMedia } from '@/app/admin/actions'
import { Button } from '@/components/ui/button'
import type { FieldOption } from '@/lib/admin/fields'
import { uploadToCloudinary } from '@/lib/admin/upload'
import { cloudinaryImageUrl } from '@/lib/cloudinary/url'
import { formatBytes } from '@/lib/utils/format'

import { ImageUploadFlow } from './image-picker'
import { inputClasses } from './ui'

const parse = <T,>(value: string, fallback: T): T => {
  try {
    const parsed = JSON.parse(value) as unknown
    return (parsed ?? fallback) as T
  } catch {
    return fallback
  }
}

type Option = { id: string; label_mdx: string }

/** MCQ/MSQ choices, stored as [{ id, label_mdx }]. */
export function OptionsField({
  name,
  defaultValue,
  label,
}: {
  name: string
  defaultValue: string
  label: string
}) {
  const [options, setOptions] = useState<Option[]>(() => {
    const parsed = parse<unknown>(defaultValue, [])
    return Array.isArray(parsed) ? (parsed as Option[]) : []
  })
  const update = (index: number, label_mdx: string) =>
    setOptions((all) => all.map((o, i) => (i === index ? { ...o, label_mdx } : o)))
  const nextId = () => {
    const used = new Set(options.map((o) => o.id))
    for (let i = 0; i < 26; i++) {
      const id = String.fromCharCode(97 + i)
      if (!used.has(id)) return id
    }
    return `o${options.length + 1}`
  }
  return (
    <fieldset>
      <legend className="sr-only">{label}</legend>
      <input type="hidden" name={name} value={JSON.stringify(options)} />
      <ol className="space-y-2">
        {options.map((option, index) => (
          <li key={option.id} className="flex items-center gap-2">
            <span
              className="w-6 shrink-0 text-center font-mono text-small text-muted"
              aria-hidden="true"
            >
              {option.id}
            </span>
            <input
              value={option.label_mdx}
              onChange={(e) => update(index, e.target.value)}
              aria-label={`Option ${option.id}`}
              placeholder="Option text (Markdown and $maths$ allowed)"
              className={inputClasses}
            />
            <button
              type="button"
              onClick={() => setOptions((all) => all.filter((_, i) => i !== index))}
              className="min-h-10 rounded px-2 text-small text-muted hover:bg-surface hover:text-danger"
              aria-label={`Remove option ${option.id}`}
            >
              ✕
            </button>
          </li>
        ))}
      </ol>
      <Button
        size="sm"
        variant="secondary"
        className="mt-2"
        onClick={() => setOptions((all) => [...all, { id: nextId(), label_mdx: '' }])}
      >
        Add option
      </Button>
    </fieldset>
  )
}

type Source = { title: string; url: string }

/** Official sources cited on a page, stored as [{ title, url }]. */
export function SourcesField({
  name,
  defaultValue,
  label,
}: {
  name: string
  defaultValue: string
  label: string
}) {
  const [sources, setSources] = useState<Source[]>(() => {
    const parsed = parse<unknown>(defaultValue, [])
    return Array.isArray(parsed) ? (parsed as Source[]) : []
  })
  const set = (index: number, patch: Partial<Source>) =>
    setSources((all) => all.map((s, i) => (i === index ? { ...s, ...patch } : s)))
  return (
    <fieldset>
      <legend className="sr-only">{label}</legend>
      <input
        type="hidden"
        name={name}
        value={JSON.stringify(sources.filter((s) => s.title.trim() && s.url.trim()))}
      />
      <ul className="space-y-2">
        {sources.map((source, index) => (
          <li key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <input
              value={source.title}
              onChange={(e) => set(index, { title: e.target.value })}
              aria-label="Source title"
              placeholder="Title"
              className={inputClasses}
            />
            <input
              value={source.url}
              onChange={(e) => set(index, { url: e.target.value })}
              aria-label="Source URL"
              placeholder="https://study.iitm.ac.in/…"
              type="url"
              className={inputClasses}
            />
            <button
              type="button"
              onClick={() => setSources((all) => all.filter((_, i) => i !== index))}
              className="min-h-10 rounded px-2 text-small text-muted hover:bg-surface hover:text-danger"
              aria-label="Remove source"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
      <Button
        size="sm"
        variant="secondary"
        className="mt-2"
        onClick={() => setSources((all) => [...all, { title: '', url: '' }])}
      >
        Add source
      </Button>
    </fieldset>
  )
}

/** A Cloudinary image public id with upload and preview. */
export function ImageField({
  name,
  defaultValue,
  label,
  invalid,
  onValueChange,
}: {
  name: string
  defaultValue: string
  label: string
  invalid?: boolean
  onValueChange?: (value: string) => void
}) {
  const id = useId()
  const [value, setStateValue] = useState(defaultValue)
  const setValue = (next: string) => {
    setStateValue(next)
    onValueChange?.(next)
  }
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin preview straight from Cloudinary
          <img
            src={cloudinaryImageUrl(value, { width: 240, height: 126, crop: 'fill' })}
            alt=""
            width={120}
            height={63}
            className="rounded border border-border bg-surface object-cover"
          />
        ) : null}
        <input
          id={id}
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value.trim())}
          aria-label={`${label} (Cloudinary ID)`}
          aria-invalid={invalid || undefined}
          placeholder="Cloudinary ID, or upload"
          className={`${inputClasses} max-w-sm flex-1 font-mono text-small`}
        />
        {value ? (
          <Button size="sm" variant="ghost" onClick={() => setValue('')}>
            Clear
          </Button>
        ) : null}
      </div>
      <ImageUploadFlow compact onDone={(asset) => setValue(asset.public_id)} />
    </div>
  )
}

/**
 * A private downloadable file. Uploaded with "authenticated" delivery so it can
 * only be fetched through /api/download (counted, rate limited). Fills in the
 * file type, format and size fields of the same form.
 */
export function FileField({
  name,
  defaultValue,
  label,
}: {
  name: string
  defaultValue: string
  label: string
}) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState(defaultValue)
  const [progress, setProgress] = useState<number | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function onFile(file: File | undefined) {
    if (!file) return
    setMessage(null)
    try {
      setProgress(0)
      const asset = await uploadToCloudinary(file, {
        type: 'authenticated',
        folder: 'files',
        onProgress: setProgress,
      })
      setValue(asset.public_id)
      const form = inputRef.current?.form
      const setField = (field: string, fieldValue: string) => {
        const element = form?.elements.namedItem(field)
        if (element instanceof HTMLInputElement || element instanceof HTMLSelectElement)
          element.value = fieldValue
      }
      setField('cloudinary_resource_type', asset.resource_type)
      setField('file_format', asset.format ?? '')
      setField('file_bytes', asset.bytes ? String(asset.bytes) : '')
      await registerMedia({
        ...asset,
        alt_text: asset.resource_type === 'image' ? file.name : null,
      })
      setMessage(
        `Uploaded ${file.name}${asset.bytes ? ` (${formatBytes(asset.bytes)})` : ''}. Save to attach it.`,
      )
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Upload failed.')
    } finally {
      setProgress(null)
    }
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value.trim())}
        aria-label={`${label} (Cloudinary ID)`}
        placeholder="Upload a file"
        className={`${inputClasses} font-mono text-small`}
      />
      <div className="flex flex-wrap items-center gap-2">
        <input
          id={id}
          type="file"
          className="sr-only"
          accept=".pdf,.csv,.xlsx,.xls,.ods,.zip,.txt,.ipynb,.py"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        <label
          htmlFor={id}
          className="inline-flex min-h-10 cursor-pointer items-center rounded-control border border-border-strong bg-card px-3 text-small font-medium text-text hover:border-accent"
        >
          {progress !== null
            ? `Uploading… ${Math.round(progress * 100)}%`
            : value
              ? 'Replace file'
              : 'Upload file'}
        </label>
        {message ? <span className="text-xs text-muted">{message}</span> : null}
      </div>
    </div>
  )
}

/** A native select with a filter box for long option lists (weeks, assignments). */
export function ReferenceSelect({
  id,
  name,
  defaultValue,
  options,
  required,
  invalid,
  describedBy,
}: {
  id: string
  name: string
  defaultValue: string
  options: FieldOption[]
  required?: boolean
  invalid?: boolean
  describedBy?: string
}) {
  const [filter, setFilter] = useState('')
  const [value, setValue] = useState(defaultValue)
  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.value === value || o.label.toLowerCase().includes(q))
  }, [filter, options, value])

  return (
    <div className="space-y-1.5">
      {options.length > 12 ? (
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Type to filter…"
          aria-label="Filter options"
          aria-controls={id}
          className={`${inputClasses} min-h-9 text-small sm:min-h-9`}
        />
      ) : null}
      <select
        id={id}
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        required={required}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={inputClasses}
      >
        <option value="">{required ? 'Choose…' : '— None —'}</option>
        {visible.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

/** JSON textarea that validates as you type. */
export function JsonField({
  id,
  name,
  defaultValue,
  rows = 6,
  describedBy,
}: {
  id: string
  name: string
  defaultValue: string
  rows?: number
  describedBy?: string
}) {
  const [value, setValue] = useState(defaultValue)
  const error = useMemo(() => {
    if (!value.trim()) return null
    try {
      JSON.parse(value)
      return null
    } catch (e) {
      return e instanceof Error ? e.message : 'Invalid JSON'
    }
  }, [value])
  return (
    <div>
      <textarea
        id={id}
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={rows}
        spellCheck={false}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy}
        className={`${inputClasses} py-2 font-mono text-small`}
      />
      {error ? <p className="mt-1 text-xs text-danger">{error}</p> : null}
    </div>
  )
}
