'use client'

import { useRouter } from 'next/navigation'
import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'

import type { SaveState } from '@/app/admin/actions'
import { Button } from '@/components/ui/button'
import type { Field, FieldOption, FieldSection, ReferenceKey } from '@/lib/admin/fields'
import type { ResourceConfig } from '@/lib/admin/resources'
import { cn } from '@/lib/utils/cn'

import { MdxEditor } from './mdx-editor'
import {
  FileField,
  ImageField,
  JsonField,
  OptionsField,
  ReferenceSelect,
  SourcesField,
} from './structured-fields'
import { inputClasses } from './ui'

type Props = {
  config: ResourceConfig
  values: Record<string, string>
  options: Partial<Record<ReferenceKey, FieldOption[]>>
  action: (prev: SaveState, formData: FormData) => Promise<SaveState>
  isNew: boolean
  siteName: string
  siteOrigin: string
  publicPath: string | null
}

const initial: SaveState = { status: 'idle' }

const SECTION_TITLES: Record<FieldSection, string> = {
  main: 'Details',
  content: 'Content',
  publishing: 'Publishing',
  source: 'Source and authorship',
  seo: 'Search appearance',
}

const slugify = (text: string) =>
  text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)

export function ResourceForm({
  config,
  values,
  options,
  action,
  isNew,
  siteName,
  siteOrigin,
  publicPath,
}: Props) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction, pending] = useActionState(action, initial)
  const [edited, setEdited] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  // Edits since the last submit, or a submit that did not save.
  const dirty = edited || (submitted && !pending && state.status !== 'saved')

  // Refresh server data (status badge, history) after a successful save.
  useEffect(() => {
    if (state.status === 'saved') router.refresh()
  }, [state, router])

  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        formRef.current?.requestSubmit()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const fieldsIn = (section: FieldSection) =>
    config.fields.filter((f) => (f.section ?? 'main') === section)
  const side: FieldSection[] = ['publishing', 'source']
  const errors = state.errors ?? {}

  const render = (field: Field) => (
    <FieldRow
      key={field.name}
      field={field}
      value={values[field.name] ?? defaultFor(field)}
      options={options}
      error={errors[field.name]}
      readOnly={field.readOnly && !isNew}
      formRef={formRef}
    />
  )

  return (
    <form
      ref={formRef}
      noValidate
      onInput={() => setEdited(true)}
      onSubmit={(event) => {
        event.preventDefault()
        setEdited(false)
        setSubmitted(true)
        // Submitting manually keeps the fields as typed (React resets forms
        // after a form action), so warnings and errors never lose edits.
        const formData = new FormData(event.currentTarget)
        startTransition(() => formAction(formData))
      }}
    >
      <div aria-live="polite">
        {state.status === 'error' && state.message ? (
          <div
            role="alert"
            className="mb-4 rounded-control border border-danger/30 bg-danger-soft px-4 py-3 text-small text-danger"
          >
            {state.message}
          </div>
        ) : null}
        {state.status === 'warnings' && state.warnings?.length ? (
          <div className="mb-4 rounded-control border border-warning/30 bg-warning-soft px-4 py-3 text-small text-text">
            <p className="font-semibold text-warning">{state.message}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {state.warnings.map((w) => (
                <li key={`${w.code}-${w.field ?? ''}-${w.message}`}>{w.message}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">
          <Section title={SECTION_TITLES.main}>{fieldsIn('main').map(render)}</Section>
          {fieldsIn('content').length ? (
            <Section title={SECTION_TITLES.content}>{fieldsIn('content').map(render)}</Section>
          ) : null}
          {fieldsIn('seo').length ? (
            <Section title={SECTION_TITLES.seo}>
              <SerpPreview
                formRef={formRef}
                titleField={config.titleColumn}
                siteName={siteName}
                url={`${siteOrigin}${publicPath ?? ''}`}
              />
              {fieldsIn('seo').map(render)}
            </Section>
          ) : null}
        </div>
        <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          {side.map((section) =>
            fieldsIn(section).length ? (
              <Section key={section} title={SECTION_TITLES[section]}>
                {fieldsIn(section).map(render)}
              </Section>
            ) : null,
          )}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:pl-68">
          <Button type="submit" disabled={pending}>
            {pending
              ? 'Saving…'
              : isNew
                ? `Create ${config.singular.toLowerCase()}`
                : 'Save changes'}
          </Button>
          {state.status === 'warnings' ? (
            <label className="flex min-h-11 items-center gap-2 text-small text-text">
              <input
                type="checkbox"
                name="acknowledge_warnings"
                className="size-4 accent-[var(--accent-strong)]"
              />
              Save anyway
            </label>
          ) : null}
          <p className="text-small text-muted" role="status">
            {state.status === 'saved' && !dirty ? (
              <span className="text-success">{state.message}</span>
            ) : dirty ? (
              'Unsaved changes'
            ) : null}
          </p>
          <span className="ml-auto hidden text-xs text-muted sm:inline">Ctrl/⌘ + S to save</span>
        </div>
      </div>
    </form>
  )
}

function defaultFor(field: Field): string {
  if (field.default === undefined) return ''
  if (typeof field.default === 'boolean') return field.default ? 'true' : ''
  return String(field.default)
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-card border border-border bg-card p-4 sm:p-5">
      <legend className="sr-only">{title}</legend>
      <h2 className="mb-4 text-small font-semibold text-text" aria-hidden="true">
        {title}
      </h2>
      <div className="space-y-5">{children}</div>
    </fieldset>
  )
}

function FieldRow({
  field,
  value,
  options,
  error,
  readOnly,
  formRef,
}: {
  field: Field
  value: string
  options: Partial<Record<ReferenceKey, FieldOption[]>>
  error?: string
  readOnly?: boolean
  formRef: RefObject<HTMLFormElement | null>
}) {
  const id = `field-${field.name}`
  const helpId = field.help ? `${id}-help` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [helpId, errorId].filter(Boolean).join(' ') || undefined
  const invalid = Boolean(error)

  if (field.type === 'boolean') {
    return (
      <div>
        <label className="flex min-h-11 items-start gap-3 text-small text-text">
          <input
            type="checkbox"
            name={field.name}
            defaultChecked={value === 'true'}
            aria-describedby={describedBy}
            className="mt-0.5 size-4 accent-[var(--accent-strong)]"
          />
          <span>
            {field.label}
            {field.help ? (
              <span id={helpId} className="mt-0.5 block text-xs text-muted">
                {field.help}
              </span>
            ) : null}
          </span>
        </label>
        {error ? <FieldError id={errorId!} message={error} /> : null}
      </div>
    )
  }

  let control: ReactNode
  switch (field.type) {
    case 'mdx':
      control = (
        <MdxEditor
          name={field.name}
          label={field.label}
          defaultValue={value}
          rows={field.rows}
          required={field.required}
          invalid={invalid}
          describedBy={describedBy}
        />
      )
      break
    case 'textarea':
      control = (
        <CountedTextarea
          id={id}
          field={field}
          defaultValue={value}
          invalid={invalid}
          describedBy={describedBy}
        />
      )
      break
    case 'json':
      control = (
        <JsonField
          id={id}
          name={field.name}
          defaultValue={value}
          rows={field.rows}
          describedBy={describedBy}
        />
      )
      break
    case 'options':
      control = <OptionsField name={field.name} defaultValue={value} label={field.label} />
      break
    case 'sources':
      control = <SourcesField name={field.name} defaultValue={value} label={field.label} />
      break
    case 'image':
      control = (
        <ImageField name={field.name} defaultValue={value} label={field.label} invalid={invalid} />
      )
      break
    case 'file':
      control = <FileField name={field.name} defaultValue={value} label={field.label} />
      break
    case 'reference':
      control = (
        <ReferenceSelect
          id={id}
          name={field.name}
          defaultValue={value}
          options={options[field.reference as ReferenceKey] ?? []}
          required={field.required}
          invalid={invalid}
          describedBy={describedBy}
        />
      )
      break
    case 'select':
      control = (
        <select
          id={id}
          name={field.name}
          defaultValue={value}
          required={field.required}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={inputClasses}
        >
          {!field.required ? <option value="">— None —</option> : null}
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )
      break
    case 'datetime':
      control = (
        <div className="flex items-center gap-2">
          <input
            id={id}
            name={field.name}
            type="datetime-local"
            defaultValue={value}
            required={field.required}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            className={inputClasses}
          />
          <span className="text-xs font-medium text-muted">IST</span>
        </div>
      )
      break
    case 'slug':
      control = (
        <SlugInput
          id={id}
          field={field}
          defaultValue={value}
          invalid={invalid}
          describedBy={describedBy}
          formRef={formRef}
        />
      )
      break
    default:
      control = (
        <input
          id={id}
          name={field.name}
          type={field.type === 'number' ? 'number' : field.type === 'url' ? 'text' : 'text'}
          inputMode={field.type === 'number' ? 'decimal' : field.type === 'url' ? 'url' : undefined}
          step={field.type === 'number' ? 'any' : undefined}
          defaultValue={value}
          required={field.required}
          readOnly={readOnly}
          maxLength={field.max}
          placeholder={field.placeholder}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn(inputClasses, readOnly && 'bg-surface text-muted')}
        />
      )
  }

  const labelled =
    field.type === 'mdx' ||
    field.type === 'options' ||
    field.type === 'sources' ||
    field.type === 'image' ||
    field.type === 'file'
  return (
    <div>
      {labelled ? (
        <p className="mb-1.5 text-small font-medium text-text">
          {field.label}
          {field.required ? <span className="text-danger"> *</span> : null}
        </p>
      ) : (
        <label htmlFor={id} className="mb-1.5 block text-small font-medium text-text">
          {field.label}
          {field.required ? <span className="text-danger"> *</span> : null}
        </label>
      )}
      {control}
      {field.help ? (
        <p id={helpId} className="mt-1 text-xs text-muted">
          {field.help}
        </p>
      ) : null}
      {error ? <FieldError id={errorId!} message={error} /> : null}
    </div>
  )
}

function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <p id={id} className="mt-1 text-xs font-medium text-danger">
      {message}
    </p>
  )
}

function CountedTextarea({
  id,
  field,
  defaultValue,
  invalid,
  describedBy,
}: {
  id: string
  field: Field
  defaultValue: string
  invalid: boolean
  describedBy?: string
}) {
  const [length, setLength] = useState(defaultValue.length)
  return (
    <div>
      <textarea
        id={id}
        name={field.name}
        defaultValue={defaultValue}
        rows={field.rows ?? 3}
        maxLength={field.max}
        required={field.required}
        onChange={(e) => setLength(e.target.value.length)}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={cn(inputClasses, 'py-2')}
      />
      {field.max ? (
        <p className="mt-0.5 text-right text-xs text-muted tabular-nums" aria-hidden="true">
          {length}/{field.max}
        </p>
      ) : null}
    </div>
  )
}

function SlugInput({
  id,
  field,
  defaultValue,
  invalid,
  describedBy,
  formRef,
}: {
  id: string
  field: Field
  defaultValue: string
  invalid: boolean
  describedBy?: string
  formRef: RefObject<HTMLFormElement | null>
}) {
  const ref = useRef<HTMLInputElement>(null)
  const fromTitle = () => {
    const form = formRef.current
    const source = ['title', 'name', 'short_name']
      .map((n) => form?.elements.namedItem(n))
      .find((el) => el instanceof HTMLInputElement && el.value.trim())
    if (source instanceof HTMLInputElement && ref.current) {
      ref.current.value = slugify(source.value)
      ref.current.dispatchEvent(new Event('input', { bubbles: true }))
    }
  }
  return (
    <div className="flex gap-2">
      <input
        ref={ref}
        id={id}
        name={field.name}
        defaultValue={defaultValue}
        required={field.required}
        pattern="[a-z0-9]+(-[a-z0-9]+)*"
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={cn(inputClasses, 'font-mono text-small')}
      />
      <Button size="sm" variant="secondary" onClick={fromTitle}>
        From title
      </Button>
    </div>
  )
}

/** Approximate Google result for this page, updated as you type. */
function SerpPreview({
  formRef,
  titleField,
  siteName,
  url,
}: {
  formRef: RefObject<HTMLFormElement | null>
  titleField: string
  siteName: string
  url: string
}) {
  const [snapshot, setSnapshot] = useState({ title: '', description: '' })
  useEffect(() => {
    const form = formRef.current
    if (!form) return
    const get = (name: string) => {
      const element = form.elements.namedItem(name)
      return element && 'value' in element ? String(element.value).trim() : ''
    }
    const read = () => {
      const base = get(titleField)
      setSnapshot({
        title: get('seo_title') || (base ? `${base} | ${siteName}` : ''),
        description: get('seo_description') || get('summary') || get('description'),
      })
    }
    read()
    form.addEventListener('input', read)
    return () => form.removeEventListener('input', read)
  }, [formRef, titleField, siteName])

  const titleTone = snapshot.title.length > 65 ? 'text-warning' : 'text-muted'
  const descriptionTone =
    snapshot.description.length > 165 || (snapshot.description && snapshot.description.length < 70)
      ? 'text-warning'
      : 'text-muted'
  return (
    <div className="rounded-control border border-border bg-surface p-4">
      <p className="text-xs font-medium text-muted">Search result preview</p>
      <div className="mt-2 max-w-[600px] font-[arial,sans-serif]">
        <p className="truncate text-xs text-text">{url.replace(/^https?:\/\//, '')}</p>
        <p className="truncate text-[1.2rem] leading-7 text-[#1a0dab]">
          {snapshot.title || 'Page title'}
        </p>
        <p className="line-clamp-2 text-small text-text">
          {snapshot.description ||
            'Add a meta description or summary — otherwise Google picks text from the page.'}
        </p>
      </div>
      <p className="mt-2 text-xs text-muted">
        <span className={titleTone}>Title {snapshot.title.length}/60</span> ·{' '}
        <span className={descriptionTone}>Description {snapshot.description.length}/155</span> ·
        When the SEO title is empty, the page’s title template is used.
      </p>
    </div>
  )
}
