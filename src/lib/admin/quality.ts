import type { ResourceConfig } from './resources'

/**
 * The pre-publish quality gate. Warnings never block saving a draft; when
 * publishing, the editor must acknowledge them. Pure (tested in
 * tests/unit/quality.test.ts); the server supplies duplicate and MDX checks.
 */

export type QualityWarning = { code: string; message: string; field?: string }

export type QualityInput = {
  config: ResourceConfig
  record: Record<string, unknown>
  minWords: number
  duplicateTitle: boolean
  mdxProblems: Array<{ field: string; message: string }>
}

const UNSCHEDULED_YEAR = 2090

const plainWords = (text: string) =>
  text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#*_>`~|$\\[\]()!-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length

/**
 * Components that render substantial text from the database (the syllabus
 * overview lists every week's topics) count as this many words, so a page
 * built around one is not flagged as thin.
 */
const DATA_COMPONENT_WORDS: Record<string, number> = { SyllabusOverview: 250 }

/** Words a reader sees: the MDX text plus the text data components render. */
export function substantiveWords(text: string): number {
  let count = plainWords(text)
  for (const [name, credit] of Object.entries(DATA_COMPONENT_WORDS)) {
    count += (text.match(new RegExp(`<${name}\\b`, 'g')) ?? []).length * credit
  }
  return count
}

const str = (value: unknown) => (typeof value === 'string' ? value : '')

export function checkQuality({
  config,
  record,
  minWords,
  duplicateTitle,
  mdxProblems,
}: QualityInput): QualityWarning[] {
  const warnings: QualityWarning[] = []
  const bodies = (config.bodyFields ?? []).map((field) => ({ field, text: str(record[field]) }))
  const bodyText = bodies.map((b) => b.text).join('\n')

  if (
    (config.table === 'notes' || (config.table === 'pages' && record.template !== 'legal')) &&
    substantiveWords(bodyText) < minWords
  ) {
    warnings.push({
      code: 'thin',
      field: config.bodyFields?.[0],
      message: `Only ${substantiveWords(bodyText)} words — pages under ${minWords} words rarely rank. Add worked examples or merge it into another page.`,
    })
  }

  const hasSeoFields = config.fields.some((f) => f.name === 'seo_description')
  if (
    hasSeoFields &&
    !str(record.seo_description) &&
    !str(record.summary) &&
    !str(record.description)
  ) {
    warnings.push({
      code: 'meta',
      field: 'seo_description',
      message: 'No meta description or summary — search engines will pick a random snippet.',
    })
  }
  const seoTitle = str(record.seo_title)
  if (seoTitle.length > 65) {
    warnings.push({
      code: 'title-length',
      field: 'seo_title',
      message: `SEO title is ${seoTitle.length} characters; Google usually shows about 60.`,
    })
  }
  const seoDescription = str(record.seo_description)
  if (seoDescription.length > 165) {
    warnings.push({
      code: 'description-length',
      field: 'seo_description',
      message: `Meta description is ${seoDescription.length} characters; about 155 are shown.`,
    })
  }

  if (/!\[\s*\]\(/.test(bodyText)) {
    warnings.push({
      code: 'alt',
      message:
        'An image has no alt text. Describe what it shows for screen readers and image search.',
    })
  }

  const linksInternally = /\]\(\/[^)]*\)|<RelatedLink\b/.test(bodyText)
  if (
    (config.table === 'notes' || config.table === 'pages' || config.table === 'assignments') &&
    bodyText.trim() &&
    !linksInternally
  ) {
    warnings.push({
      code: 'links',
      message:
        'No internal links. Link related weeks, notes or guides (e.g. <RelatedLink href="/qualifier/eligibility" />).',
    })
  }

  if (duplicateTitle) {
    warnings.push({
      code: 'duplicate',
      field: config.titleColumn,
      message: 'Another item already uses this title. Titles should be unique.',
    })
  }

  for (const problem of mdxProblems) {
    warnings.push({ code: 'mdx', field: problem.field, message: problem.message })
  }

  const permission = str(record.source_permission)
  if (
    (permission === 'permission_granted' || permission === 'official_link') &&
    !str(record.source_url)
  ) {
    warnings.push({
      code: 'source',
      field: 'source_url',
      message: 'Add the source URL for shared or official material.',
    })
  }

  if (config.table === 'assignments' && record.type === 'graded') {
    const release = str(record.solutions_release_at)
    if (release && new Date(release).getUTCFullYear() >= UNSCHEDULED_YEAR) {
      warnings.push({
        code: 'release',
        field: 'solutions_release_at',
        message:
          'The solution release time is still the placeholder — walkthroughs will never unlock. Set it to after the deadline.',
      })
    }
    if (!str(record.due_at)) {
      warnings.push({
        code: 'due',
        field: 'due_at',
        message: 'No due time set — the page and deadline widget cannot show it.',
      })
    }
  }

  return warnings
}
