import Link from 'next/link'

import { AdminHeader, Panel, StatCard } from '@/components/admin/ui'
import { Badge } from '@/components/ui/badge'
import { recordTitle } from '@/lib/admin/display'
import { adminDb } from '@/lib/admin/records'
import { getResource } from '@/lib/admin/resources'
import { requireStaff } from '@/lib/auth/session'
import { getSiteSettings } from '@/lib/data/settings'
import { SITEMAP_SECTIONS, getSitemapEntries } from '@/lib/data/sitemap'
import { mdxToPlainText } from '@/lib/mdx/plain'
import { daysAgo } from '@/lib/utils/dates'

// Staff-only and always fresh: renders on request, never from a prefetch.
export const instant = false

type Row = Record<string, unknown>
type Issue = { key: string; resource: string; id: string; title: string; detail?: string }

const TABLES = [
  { resource: 'programs', body: 'intro_mdx', columns: 'id, name, slug, description' },
  { resource: 'courses', body: 'intro_mdx', columns: 'id, name, slug, description, program_id' },
  { resource: 'weeks', body: 'intro_mdx', columns: 'id, title, summary, course_id' },
  {
    resource: 'assignments',
    body: 'intro_mdx',
    columns: 'id, title, summary, type, author_id, course_id',
  },
  {
    resource: 'notes',
    body: 'body_mdx',
    columns: 'id, title, slug, summary, word_count, author_id, kind, course_id',
  },
  { resource: 'pages', body: 'body_mdx', columns: 'id, title, path, summary, template' },
] as const

const PLACEHOLDER_YEAR = 2090
const hasInternalLink = (text: string) => /\]\(\/[^)]*\)|<RelatedLink\b/.test(text)
const str = (value: unknown) => (typeof value === 'string' ? value : '')

export default async function SeoReportPage() {
  await requireStaff()
  const [db, settings, sitemap] = await Promise.all([
    adminDb(),
    getSiteSettings(),
    getSitemapEntries(),
  ])
  const staleBefore = daysAgo(settings.content.stale_days).getTime()

  const results = await Promise.all(
    TABLES.map(async (table) => {
      const columns: string = `${table.columns}, ${table.body}, seo_title, seo_description, noindex, updated_at`
      const { data } = await db
        .from(table.resource)
        .select(columns)
        .is('deleted_at', null)
        .eq('is_published', true)
      return { ...table, rows: (data ?? []) as unknown as Row[] }
    }),
  )
  const { data: graded } = await db
    .from('assignments')
    .select('id, title, solutions_release_at, due_at')
    .is('deleted_at', null)
    .eq('is_published', true)
    .eq('type', 'graded')
  const { data: keywordRows } = await db
    .from('keyword_clusters')
    .select('id, path, primary_keyword')

  const issues: Issue[] = []
  const titlesSeen = new Map<string, Issue>()
  for (const { resource, body, rows } of results) {
    const config = getResource(resource)!
    for (const row of rows) {
      const base = { resource, id: String(row.id), title: recordTitle(config, row) }
      const bodyText = str(row[body])
      const description = str(row.seo_description) || str(row.summary) || str(row.description)
      if (!description) issues.push({ ...base, key: 'no-description' })
      if (str(row.seo_title).length > 65) {
        issues.push({
          ...base,
          key: 'long-title',
          detail: `${str(row.seo_title).length} characters`,
        })
      }
      if (str(row.seo_description).length > 165) {
        issues.push({
          ...base,
          key: 'long-description',
          detail: `${str(row.seo_description).length} characters`,
        })
      }
      const words =
        resource === 'notes'
          ? Number(row.word_count ?? 0)
          : mdxToPlainText(bodyText).split(/\s+/).filter(Boolean).length
      const needsWords = resource === 'notes' || (resource === 'pages' && row.template !== 'legal')
      if (needsWords && words < settings.content.min_words_warning) {
        issues.push({ ...base, key: 'thin', detail: `${words} words` })
      }
      if (
        (resource === 'notes' || resource === 'pages') &&
        bodyText.trim() &&
        !hasInternalLink(bodyText)
      ) {
        issues.push({ ...base, key: 'no-links' })
      }
      if ((resource === 'notes' || resource === 'assignments') && !row.author_id) {
        issues.push({ ...base, key: 'no-author' })
      }
      if (row.noindex) issues.push({ ...base, key: 'noindex' })
      if (resource === 'notes' && Date.parse(str(row.updated_at)) < staleBefore) {
        issues.push({
          ...base,
          key: 'stale',
          detail: `updated ${str(row.updated_at).slice(0, 10)}`,
        })
      }
      // Titles only clash under the same parent: templates add the course or programme.
      const parent = str(row.course_id) || str(row.program_id)
      const titleKey = `${resource}:${parent}:${base.title.trim().toLowerCase()}`
      const first = titlesSeen.get(titleKey)
      if (first)
        issues.push({ ...base, key: 'duplicate-title', detail: `same as “${first.title}”` })
      else titlesSeen.set(titleKey, { ...base, key: '' })
    }
  }
  for (const row of (graded ?? []) as Row[]) {
    const base = { resource: 'assignments', id: String(row.id), title: str(row.title) }
    if (new Date(str(row.solutions_release_at)).getUTCFullYear() >= PLACEHOLDER_YEAR) {
      issues.push({ ...base, key: 'placeholder-release' })
    }
    if (!row.due_at) issues.push({ ...base, key: 'no-due' })
  }

  const livePaths = new Set(sitemap.map((entry) => entry.path))
  const keywordPaths = new Set(((keywordRows ?? []) as Row[]).map((row) => str(row.path)))
  for (const row of (keywordRows ?? []) as Row[]) {
    if (!livePaths.has(str(row.path))) {
      issues.push({
        resource: 'keywords',
        id: String(row.id),
        title: str(row.primary_keyword),
        key: 'keyword-orphan',
        detail: `${str(row.path)} is not a live page`,
      })
    }
  }
  const withoutKeywords = sitemap.filter((entry) => !keywordPaths.has(entry.path))

  const CHECKS: Array<{
    key: string
    title: string
    why: string
    severity: 'danger' | 'warning' | 'neutral'
  }> = [
    {
      key: 'placeholder-release',
      title: 'Graded assignments that never unlock',
      why: 'The solution release time is still the placeholder.',
      severity: 'danger',
    },
    {
      key: 'no-description',
      title: 'Missing meta description',
      why: 'Without one, Google picks a random snippet.',
      severity: 'warning',
    },
    {
      key: 'thin',
      title: 'Thin content',
      why: `Fewer than ${settings.content.min_words_warning} words rarely rank.`,
      severity: 'warning',
    },
    {
      key: 'duplicate-title',
      title: 'Duplicate titles',
      why: 'Pages compete with each other for the same query.',
      severity: 'warning',
    },
    {
      key: 'no-links',
      title: 'No internal links',
      why: 'Links spread authority and help students find the next step.',
      severity: 'warning',
    },
    {
      key: 'no-author',
      title: 'No author',
      why: 'A named, credentialed author supports E-E-A-T.',
      severity: 'neutral',
    },
    {
      key: 'long-title',
      title: 'SEO title too long',
      why: 'Google usually shows about 60 characters.',
      severity: 'neutral',
    },
    {
      key: 'long-description',
      title: 'Meta description too long',
      why: 'About 155 characters are shown.',
      severity: 'neutral',
    },
    {
      key: 'no-due',
      title: 'Graded assignments without a due time',
      why: 'The deadline widget cannot show them.',
      severity: 'neutral',
    },
    {
      key: 'stale',
      title: 'Not updated recently',
      why: `No edits in ${settings.content.stale_days} days — check the content is still right.`,
      severity: 'neutral',
    },
    {
      key: 'noindex',
      title: 'Hidden from search (noindex)',
      why: 'Intentional? These pages will not appear in Google.',
      severity: 'neutral',
    },
    {
      key: 'keyword-orphan',
      title: 'Keyword notes for missing pages',
      why: 'The planned page is not live yet.',
      severity: 'neutral',
    },
  ]

  const bySection = SITEMAP_SECTIONS.map((section) => ({
    section,
    count: sitemap.filter((e) => e.section === section).length,
  }))

  return (
    <>
      <AdminHeader
        title="SEO report"
        description="Checks every published page for the things that most often hold rankings back. Fix the red and orange items first."
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {bySection.map(({ section, count }) => (
          <StatCard key={section} label={`In sitemap: ${section}`} value={count} />
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {CHECKS.map((check) => {
          const items = issues.filter((issue) => issue.key === check.key)
          return (
            <details
              key={check.key}
              className="group rounded-card border border-border bg-card"
              open={items.length > 0 && check.severity !== 'neutral'}
            >
              <summary className="flex min-h-12 cursor-pointer list-none flex-wrap items-center gap-3 px-4 py-3">
                <Badge tone={items.length === 0 ? 'success' : check.severity}>
                  {items.length === 0 ? 'OK' : items.length}
                </Badge>
                <span className="font-semibold text-text">{check.title}</span>
                <span className="text-small text-muted">{check.why}</span>
              </summary>
              {items.length ? (
                <ul className="divide-y divide-border border-t border-border">
                  {items.map((item) => (
                    <li
                      key={`${item.resource}-${item.id}`}
                      className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-2.5 text-small"
                    >
                      <Link
                        href={`/admin/${item.resource}/${item.id}`}
                        className="font-medium text-text hover:text-accent-ink hover:underline"
                      >
                        {item.title}
                      </Link>
                      <span className="text-muted">
                        {getResource(item.resource)?.singular}
                        {item.detail ? ` · ${item.detail}` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </details>
          )
        })}
      </div>

      <Panel
        title={`Live pages without keyword notes (${withoutKeywords.length})`}
        className="mt-6"
      >
        <p className="mb-3 text-small text-muted">
          Keyword notes record the query each page targets, so two pages never compete for the same
          search.{' '}
          <Link href="/admin/keywords/new" className="text-accent-ink underline">
            Add a keyword note
          </Link>
          .
        </p>
        {withoutKeywords.length ? (
          <ul className="columns-1 gap-6 text-small md:columns-2">
            {withoutKeywords.slice(0, 200).map((entry) => (
              <li key={entry.path} className="break-inside-avoid py-0.5">
                <a
                  href={entry.path}
                  target="_blank"
                  rel="noopener"
                  className="text-text hover:text-accent-ink hover:underline"
                >
                  {entry.path}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-small text-success">Every live page has a keyword note.</p>
        )}
      </Panel>
    </>
  )
}
