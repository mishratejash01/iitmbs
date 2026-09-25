'use client'

import { useRouter } from 'next/navigation'
import {
  startTransition,
  useActionState,
  useEffect,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { saveSettings, type SaveState } from '@/app/admin/actions'
import { Button } from '@/components/ui/button'
import { formatTerm } from '@/lib/routes'
import type { SiteSettings } from '@/lib/settings/schema'
import { findContrastIssues } from '@/lib/theme/contrast'
import {
  TOKEN_NAMES,
  defaultTokens,
  resolveTokens,
  type ColorScheme,
  type TokenName,
} from '@/lib/theme/tokens'
import { cn } from '@/lib/utils/cn'

import { ImageField } from './structured-fields'
import { inputClasses } from './ui'

type Path = Array<string | number>

const TABS = [
  { id: 'general', label: 'General' },
  { id: 'features', label: 'Features' },
  { id: 'home', label: 'Home page' },
  { id: 'seo', label: 'SEO' },
  { id: 'qualifier', label: 'Qualifier rules' },
  { id: 'theme', label: 'Theme' },
  { id: 'contact', label: 'Contact & social' },
  { id: 'analytics', label: 'Analytics & content' },
] as const

type TabId = (typeof TABS)[number]['id']

/** Template keys the pages use, with the variables each one can fill. */
const TEMPLATE_KEYS: Array<{ key: string; label: string; vars: string }> = [
  { key: 'program', label: 'Programme hub', vars: '{program} {program_name}' },
  { key: 'program_week', label: 'Programme week hub', vars: '{program} {n} {year}' },
  { key: 'course', label: 'Course hub', vars: '{short} {course} {code} {weeks} {program}' },
  { key: 'week', label: 'Week hub', vars: '{short} {n} {week_title} {course} {code}' },
  {
    key: 'graded_assignment',
    label: 'Graded assignment (latest)',
    vars: '{short} {n} {year} {term_label}',
  },
  {
    key: 'graded_assignment_term',
    label: 'Graded assignment (archive)',
    vars: '{short} {n} {term_label} {year}',
  },
  { key: 'practice_assignment', label: 'Practice assignment (latest)', vars: '{short} {n} {year}' },
  {
    key: 'practice_assignment_term',
    label: 'Practice assignment (archive)',
    vars: '{short} {n} {term_label}',
  },
  { key: 'week_notes', label: 'Week notes', vars: '{short} {n} {week_title}' },
  { key: 'note', label: 'Topic note', vars: '{note} {short} {course}' },
  { key: 'formula_sheet', label: 'Formula sheet', vars: '{short} {course}' },
  { key: 'exam_prep', label: 'Exam prep', vars: '{short} {course}' },
  { key: 'page', label: 'CMS page', vars: '{page} {site_name}' },
]

const FEATURE_LABELS: Record<keyof SiteSettings['features'], string> = {
  login: 'Google sign-in (shows “coming soon” while the provider is off)',
  pwa: 'Installable app and offline notes',
  search: 'Site search',
  bookmarks: 'Bookmarks',
  feedback: '“Was this helpful?” feedback',
  share: 'Share buttons',
  downloads: 'Downloads',
}

function setIn<T>(object: T, path: Path, value: unknown): T {
  const copy = structuredClone(object) as Record<string | number, unknown>
  let cursor = copy
  for (const key of path.slice(0, -1)) cursor = cursor[key] as Record<string | number, unknown>
  cursor[path[path.length - 1]!] = value
  return copy as T
}

function termOptions(): string[] {
  const year = new Date().getFullYear()
  return [year - 1, year, year + 1].flatMap((y) => ['jan', 'may', 'sep'].map((t) => `${y}-${t}`))
}

export function SettingsForm({ initial }: { initial: SiteSettings }) {
  const router = useRouter()
  const [settings, setSettings] = useState(initial)
  const [tab, setTab] = useState<TabId>('general')
  const [state, formAction, pending] = useActionState(saveSettings, { status: 'idle' } as SaveState)
  const [edited, setEdited] = useState(false)
  const dirty = edited && !pending

  useEffect(() => {
    if (state.status === 'saved') router.refresh()
  }, [state, router])

  const set = (path: Path, value: unknown) => {
    setSettings((current) => setIn(current, path, value))
    setEdited(true)
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        const data = new FormData()
        data.set('settings_json', JSON.stringify(settings))
        setEdited(false)
        startTransition(() => formAction(data))
      }}
    >
      <div
        role="tablist"
        aria-label="Settings sections"
        className="no-scrollbar -mx-4 mb-6 flex gap-1 overflow-x-auto border-b border-border px-4"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={cn(
              '-mb-px min-h-11 border-b-2 px-3 text-small font-medium whitespace-nowrap',
              tab === t.id
                ? 'border-accent text-text'
                : 'border-transparent text-muted hover:text-text',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {state.status === 'error' && state.message ? (
        <p
          role="alert"
          className="mb-4 rounded-control bg-danger-soft px-4 py-3 text-small text-danger"
        >
          {state.message}
        </p>
      ) : null}
      {state.status === 'saved' && state.warnings?.length ? (
        <div className="mb-4 rounded-control bg-warning-soft px-4 py-3 text-small text-text">
          <p className="font-semibold text-warning">Saved, but some values were not valid:</p>
          <ul className="mt-1 list-disc pl-5">
            {state.warnings.map((w) => (
              <li key={w.message}>{w.message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="max-w-4xl pb-24">
        <Panel id="general" active={tab}>
          <Text
            label="Site name"
            value={settings.site_name}
            onChange={(v) => set(['site_name'], v)}
            help="Used in page titles, SEO and structured data."
          />
          <Text
            label="Display name"
            value={settings.display_name}
            onChange={(v) => set(['display_name'], v)}
            help="Shown in the header, footer and banners. Leave empty to use the site name."
          />
          <Text label="Tagline" value={settings.tagline} onChange={(v) => set(['tagline'], v)} />
          <Text
            label="Description"
            value={settings.description}
            onChange={(v) => set(['description'], v)}
            multiline
            help="Used where a page has no description of its own."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Current term"
              value={settings.current_term ?? ''}
              onChange={(v) => set(['current_term'], v || null)}
              options={[
                { value: '', label: 'Not set' },
                ...termOptions().map((t) => ({ value: t, label: formatTerm(t) })),
              ]}
              help="Used for upcoming deadlines and the {year} in programme week titles."
            />
            <NumberInput
              label="Refresh cached pages every (seconds)"
              value={settings.revalidate_seconds}
              onChange={(v) => set(['revalidate_seconds'], v)}
              min={60}
              max={604800}
              help="Publishing refreshes pages immediately; this is the safety net."
            />
          </div>
          <ImageFieldControlled
            label="Organisation logo"
            value={settings.organization.logo_public_id}
            onChange={(v) => set(['organization', 'logo_public_id'], v)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Text
              label="Organisation name"
              value={settings.organization.name}
              onChange={(v) => set(['organization', 'name'], v)}
            />
            <Text
              label="Legal name"
              value={settings.organization.legal_name}
              onChange={(v) => set(['organization', 'legal_name'], v)}
            />
            <Text
              label="Founding date"
              value={settings.organization.founding_date}
              onChange={(v) => set(['organization', 'founding_date'], v)}
              placeholder="2026-09"
            />
          </div>
        </Panel>

        <Panel id="features" active={tab}>
          <fieldset className="space-y-1">
            <legend className="mb-2 text-small font-semibold text-text">Features</legend>
            {(Object.keys(FEATURE_LABELS) as Array<keyof SiteSettings['features']>).map((key) => (
              <Toggle
                key={key}
                label={FEATURE_LABELS[key]}
                checked={settings.features[key]}
                onChange={(v) => set(['features', key], v)}
              />
            ))}
          </fieldset>
          <fieldset className="space-y-4 border-t border-border pt-5">
            <legend className="sr-only">Announcement bar</legend>
            <p className="text-small font-semibold text-text">Announcement bar</p>
            <Toggle
              label="Show the announcement bar"
              checked={settings.announcement.enabled}
              onChange={(v) => set(['announcement', 'enabled'], v)}
            />
            <Text
              label="Text"
              value={settings.announcement.text}
              onChange={(v) => set(['announcement', 'text'], v)}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Text
                label="Link"
                value={settings.announcement.href}
                onChange={(v) => set(['announcement', 'href'], v)}
                placeholder="/qualifier/timeline"
              />
              <Select
                label="Tone"
                value={settings.announcement.tone}
                onChange={(v) => set(['announcement', 'tone'], v)}
                options={[
                  { value: 'info', label: 'Information' },
                  { value: 'warning', label: 'Warning' },
                  { value: 'success', label: 'Good news' },
                ]}
              />
            </div>
          </fieldset>
        </Panel>

        <Panel id="home" active={tab}>
          <Text
            label="Hero title"
            value={settings.home.hero_title}
            onChange={(v) => set(['home', 'hero_title'], v)}
          />
          <Text
            label="Hero subtitle"
            value={settings.home.hero_subtitle}
            onChange={(v) => set(['home', 'hero_subtitle'], v)}
            multiline
          />
          <Text
            label="Popular pages"
            value={settings.home.popular_paths.join('\n')}
            onChange={(v) =>
              set(
                ['home', 'popular_paths'],
                v
                  .split('\n')
                  .map((p) => p.trim())
                  .filter(Boolean),
              )
            }
            multiline
            rows={6}
            help="One site path per line, e.g. /qualifier/eligibility. Shown as quick links on the home page."
          />
        </Panel>

        <Panel id="seo" active={tab}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Text
              label="Default title"
              value={settings.seo.default_title}
              onChange={(v) => set(['seo', 'default_title'], v)}
            />
            <Text
              label="Title template"
              value={settings.seo.title_template}
              onChange={(v) => set(['seo', 'title_template'], v)}
              help="%s is the page title, {site_name} the site name."
            />
          </div>
          <Text
            label="Default description"
            value={settings.seo.default_description}
            onChange={(v) => set(['seo', 'default_description'], v)}
            multiline
          />
          <div className="space-y-5 border-t border-border pt-5">
            <p className="text-small text-muted">
              Titles and descriptions for each page type. Variables in braces are filled per page;
              leave a template empty to use the built-in fallback. Aim for titles ≤ 60 characters
              and descriptions of 120–155.
            </p>
            {TEMPLATE_KEYS.map(({ key, label, vars }) => (
              <div key={key} className="rounded-control border border-border p-3">
                <p className="text-small font-medium text-text">
                  {label} <span className="font-normal text-muted">· {vars}</span>
                </p>
                <div className="mt-2 grid gap-3">
                  <Text
                    label="Title"
                    value={settings.seo.templates[key] ?? ''}
                    onChange={(v) => set(['seo', 'templates', key], v)}
                    counter={60}
                  />
                  {key.endsWith('_term') || key === 'page' ? null : (
                    <Text
                      label="Description"
                      value={settings.seo.description_templates[key] ?? ''}
                      onChange={(v) => set(['seo', 'description_templates', key], v)}
                      multiline
                      rows={2}
                      counter={155}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel id="qualifier" active={tab}>
          <p className="text-small text-muted">
            These rules power the eligibility and score calculators. Check them against the official
            qualifier page every term.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberInput
              label="Graded assignments counted (best of)"
              value={settings.qualifier.ga_rule.best_of}
              onChange={(v) => set(['qualifier', 'ga_rule', 'best_of'], v)}
              min={1}
              max={12}
            />
            <NumberInput
              label="…from the first N weeks"
              value={settings.qualifier.ga_rule.first_weeks}
              onChange={(v) => set(['qualifier', 'ga_rule', 'first_weeks'], v)}
              min={1}
              max={12}
            />
          </div>
          <Rows
            label="Category cut-offs (%)"
            rows={settings.qualifier.categories}
            columns={[
              { key: 'id', label: 'ID', type: 'text' },
              { key: 'label', label: 'Label', type: 'text' },
              { key: 'ga_min', label: 'GA min', type: 'number' },
              { key: 'course_min', label: 'Per-course min', type: 'number' },
              { key: 'average_min', label: 'Average min', type: 'number' },
            ]}
            blank={{ id: '', label: '', ga_min: 0, course_min: 0, average_min: 0 }}
            onChange={(rows) => set(['qualifier', 'categories'], rows)}
          />
          <Rows
            label="Course load by qualifier score"
            rows={settings.qualifier.course_load}
            columns={[
              { key: 'from', label: 'Score from', type: 'number' },
              { key: 'to', label: 'Score to', type: 'number' },
              { key: 'courses', label: 'Courses allowed', type: 'number' },
            ]}
            blank={{ from: 0, to: 0, courses: 0 }}
            onChange={(rows) => set(['qualifier', 'course_load'], rows)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Text
              label="Official source URL"
              value={settings.qualifier.source_url}
              onChange={(v) => set(['qualifier', 'source_url'], v)}
            />
            <Text
              label="Last verified on"
              value={settings.qualifier.verified_on}
              onChange={(v) => set(['qualifier', 'verified_on'], v)}
              placeholder="2026-09-23"
            />
          </div>
        </Panel>

        <Panel id="theme" active={tab}>
          <ThemeEditor theme={settings.theme} onChange={(theme) => set(['theme'], theme)} />
        </Panel>

        <Panel id="contact" active={tab}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Text
              label="Contact email"
              value={settings.contact.email}
              onChange={(v) => set(['contact', 'email'], v)}
              type="email"
            />
            <Text
              label="Grievance officer"
              value={settings.contact.grievance_officer}
              onChange={(v) => set(['contact', 'grievance_officer'], v)}
              help="Name shown on the privacy policy (DPDP Act)."
            />
          </div>
          <div className="grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
            {(Object.keys(settings.social) as Array<keyof SiteSettings['social']>).map((key) => (
              <Text
                key={key}
                label={key === 'x' ? 'X (Twitter)' : key[0]!.toUpperCase() + key.slice(1)}
                value={settings.social[key]}
                onChange={(v) => set(['social', key], v)}
                placeholder="https://"
              />
            ))}
          </div>
          <div className="grid gap-4 border-t border-border pt-5 sm:grid-cols-3">
            <Text
              label="Google verification"
              value={settings.verification.google}
              onChange={(v) => set(['verification', 'google'], v)}
              help="The content of the google-site-verification meta tag."
            />
            <Text
              label="Bing verification"
              value={settings.verification.bing}
              onChange={(v) => set(['verification', 'bing'], v)}
            />
            <Text
              label="Yandex verification"
              value={settings.verification.yandex}
              onChange={(v) => set(['verification', 'yandex'], v)}
            />
          </div>
        </Panel>

        <Panel id="analytics" active={tab}>
          <div className="grid gap-4 sm:grid-cols-3">
            <NumberInput
              label="Keep raw analytics (months)"
              value={settings.analytics.retention_months}
              onChange={(v) => set(['analytics', 'retention_months'], v)}
              min={1}
              max={60}
              help="Daily totals are kept; raw events older than this are deleted."
            />
            <NumberInput
              label="Engagement heartbeat (seconds)"
              value={settings.analytics.heartbeat_seconds}
              onChange={(v) => set(['analytics', 'heartbeat_seconds'], v)}
              min={5}
              max={120}
            />
            <Text
              label="Reporting time zone"
              value={settings.analytics.timezone}
              onChange={(v) => set(['analytics', 'timezone'], v)}
            />
          </div>
          <div className="grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
            <NumberInput
              label="Warn when a page has fewer words than"
              value={settings.content.min_words_warning}
              onChange={(v) => set(['content', 'min_words_warning'], v)}
              min={0}
              max={100000}
            />
            <NumberInput
              label="Flag notes not updated for (days)"
              value={settings.content.stale_days}
              onChange={(v) => set(['content', 'stale_days'], v)}
              min={1}
              max={3650}
            />
          </div>
          <Toggle
            label="Notify search engines through IndexNow when something is published"
            checked={settings.content.indexnow_enabled}
            onChange={(v) => set(['content', 'indexnow_enabled'], v)}
          />
        </Panel>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:pl-68">
          <Button type="submit" disabled={pending}>
            {pending ? 'Saving…' : 'Save settings'}
          </Button>
          <p role="status" className="text-small text-muted">
            {dirty ? (
              'Unsaved changes'
            ) : state.status === 'saved' ? (
              <span className="text-success">{state.message}</span>
            ) : null}
          </p>
        </div>
      </div>
    </form>
  )
}

function Panel({ id, active, children }: { id: TabId; active: TabId; children: ReactNode }) {
  return (
    <div
      role="tabpanel"
      id={`panel-${id}`}
      aria-labelledby={`tab-${id}`}
      hidden={id !== active}
      className="space-y-5 rounded-card border border-border bg-card p-4 sm:p-5"
    >
      {children}
    </div>
  )
}

function Label({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-small font-medium text-text">
      {children}
    </label>
  )
}

function Help({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="mt-1 text-xs text-muted">
      {children}
    </p>
  )
}

function Text({
  label,
  value,
  onChange,
  help,
  placeholder,
  multiline,
  rows = 3,
  type = 'text',
  counter,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  help?: string
  placeholder?: string
  multiline?: boolean
  rows?: number
  type?: string
  counter?: number
}) {
  const id = useId()
  const props = {
    id,
    value,
    placeholder,
    'aria-describedby': help ? `${id}-help` : undefined,
    className: cn(inputClasses, multiline && 'py-2'),
  }
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      {multiline ? (
        <textarea {...props} rows={rows} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input {...props} type={type} onChange={(e) => onChange(e.target.value)} />
      )}
      {counter ? (
        <p
          className={cn(
            'mt-0.5 text-right text-xs tabular-nums',
            value.length > counter ? 'text-warning' : 'text-muted',
          )}
        >
          {value.length}/{counter}
        </p>
      ) : null}
      {help ? <Help id={`${id}-help`}>{help}</Help> : null}
    </div>
  )
}

function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
  help,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  help?: string
}) {
  const id = useId()
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        value={Number.isFinite(value) ? value : ''}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.valueAsNumber)}
        aria-describedby={help ? `${id}-help` : undefined}
        className={inputClasses}
      />
      {help ? <Help id={`${id}-help`}>{help}</Help> : null}
    </div>
  )
}

function Select({
  label,
  value,
  onChange,
  options,
  help,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  help?: string
}) {
  const id = useId()
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={help ? `${id}-help` : undefined}
        className={inputClasses}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {help ? <Help id={`${id}-help`}>{help}</Help> : null}
    </div>
  )
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="flex min-h-11 items-center gap-3 text-small text-text">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 accent-[var(--accent-strong)]"
      />
      {label}
    </label>
  )
}

function ImageFieldControlled({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div>
      <p className="mb-1.5 text-small font-medium text-text">{label}</p>
      <ImageField
        name="logo_public_id"
        defaultValue={value}
        label={label}
        onValueChange={onChange}
      />
    </div>
  )
}

type Column = { key: string; label: string; type: 'text' | 'number' }

function Rows<T extends Record<string, string | number>>({
  label,
  rows,
  columns,
  blank,
  onChange,
}: {
  label: string
  rows: T[]
  columns: Column[]
  blank: T
  onChange: (rows: T[]) => void
}) {
  const update = (index: number, key: string, value: string | number) =>
    onChange(rows.map((row, i) => (i === index ? { ...row, [key]: value } : row)))
  return (
    <fieldset className="border-t border-border pt-5">
      <legend className="sr-only">{label}</legend>
      <p className="mb-2 text-small font-semibold text-text">{label}</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[32rem] text-small">
          <thead>
            <tr className="text-left text-xs text-muted">
              {columns.map((c) => (
                <th key={c.key} scope="col" className="pr-2 pb-1 font-medium">
                  {c.label}
                </th>
              ))}
              <th scope="col">
                <span className="sr-only">Remove</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                {columns.map((c) => (
                  <td key={c.key} className="pr-2 pb-2">
                    <input
                      aria-label={`${c.label}, row ${index + 1}`}
                      type={c.type}
                      step="any"
                      value={row[c.key] ?? ''}
                      onChange={(e) =>
                        update(
                          index,
                          c.key,
                          c.type === 'number' ? e.target.valueAsNumber : e.target.value,
                        )
                      }
                      className={cn(inputClasses, 'min-h-10')}
                    />
                  </td>
                ))}
                <td className="pb-2">
                  <button
                    type="button"
                    onClick={() => onChange(rows.filter((_, i) => i !== index))}
                    aria-label={`Remove row ${index + 1}`}
                    className="min-h-10 rounded px-2 text-muted hover:bg-surface hover:text-danger"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button size="sm" variant="secondary" onClick={() => onChange([...rows, { ...blank }])}>
        Add row
      </Button>
    </fieldset>
  )
}

const TOKEN_LABELS: Partial<Record<TokenName, string>> = {
  bg: 'Page background',
  surface: 'Soft surface',
  card: 'Card background',
  text: 'Text',
  'text-muted': 'Secondary text',
  accent: 'Accent (decorative)',
  'accent-soft': 'Accent tint',
  'accent-strong': 'Button background',
  'accent-ink': 'Accent text and links',
  'on-accent': 'Text on buttons',
  focus: 'Focus ring',
  lime: 'Highlight: lime',
  violet: 'Highlight: violet',
  sky: 'Highlight: sky',
  sun: 'Highlight: sun',
  green: 'Highlight: green',
}

function ThemeEditor({
  theme,
  onChange,
}: {
  theme: SiteSettings['theme']
  onChange: (theme: SiteSettings['theme']) => void
}) {
  const scheme: ColorScheme = 'light'
  const resolved = useMemo(() => resolveTokens(theme), [theme])
  const issues = useMemo(() => findContrastIssues(resolved[scheme]), [resolved, scheme])
  const tokens = resolved[scheme]

  const setToken = (name: TokenName, value: string | null) => {
    const next = structuredClone(theme)
    const current = { ...(next[scheme] ?? {}) }
    if (value === null || value.toUpperCase() === defaultTokens[scheme][name].toUpperCase())
      delete current[name]
    else current[name] = value.toUpperCase()
    next[scheme] = current
    onChange(next)
  }

  return (
    <div className="space-y-5">
      <div
        className="rounded-card border p-4"
        style={{ background: tokens.bg, borderColor: tokens.border }}
        aria-label="Theme preview"
      >
        <p style={{ color: tokens.text }} className="font-semibold">
          Week 4 Graded Assignment
        </p>
        <p style={{ color: tokens['text-muted'] }} className="text-small">
          Due Fri, 2 Oct, 11:59 pm IST
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span
            className="rounded-control px-3 py-2 text-small font-medium"
            style={{ background: tokens['accent-strong'], color: tokens['on-accent'] }}
          >
            Primary button
          </span>
          <span
            className="rounded-control px-3 py-2 text-small"
            style={{ background: tokens['accent-soft'], color: tokens['accent-ink'] }}
          >
            Soft button
          </span>
          <span className="text-small underline" style={{ color: tokens['accent-ink'] }}>
            A link
          </span>
        </div>
      </div>

      {issues.length ? (
        <div
          role="alert"
          className="rounded-control bg-warning-soft px-4 py-3 text-small text-text"
        >
          <p className="font-semibold text-warning">These colour pairs fail WCAG contrast:</p>
          <ul className="mt-1 list-disc pl-5">
            {issues.map((i) => (
              <li key={`${i.foreground}-${i.background}`}>
                {TOKEN_LABELS[i.foreground] ?? i.foreground} on{' '}
                {TOKEN_LABELS[i.background] ?? i.background}: {i.ratio.toFixed(2)}:1 (needs{' '}
                {i.required}:1)
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-small text-success">All required colour pairs meet WCAG AA contrast.</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {TOKEN_NAMES.map((name) => {
          const overridden = theme[scheme]?.[name] !== undefined
          return (
            <div
              key={name}
              className="flex items-center gap-3 rounded-control border border-border p-2"
            >
              <input
                type="color"
                value={
                  tokens[name].length === 4
                    ? `#${[...tokens[name].slice(1)].map((c) => c + c).join('')}`
                    : tokens[name]
                }
                onChange={(e) => setToken(name, e.target.value)}
                aria-label={`${TOKEN_LABELS[name] ?? name} colour`}
                className="h-9 w-12 cursor-pointer rounded border border-border bg-transparent"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-small text-text">{TOKEN_LABELS[name] ?? name}</p>
                <p className="font-mono text-xs text-muted">
                  {tokens[name]}
                  {overridden ? ' · custom' : ''}
                </p>
              </div>
              {overridden ? (
                <button
                  type="button"
                  onClick={() => setToken(name, null)}
                  className="min-h-9 rounded px-2 text-xs text-muted hover:bg-surface hover:text-text"
                >
                  Reset
                </button>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
