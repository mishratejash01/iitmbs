/**
 * Understands the way students actually search ("math 1 week 2 ga",
 * "maths1 wk3 answers", "ct notes week 4", "stats formula sheet") and turns
 * it into structured filters for the search_content RPC.
 *
 * Pure and dependency-free so it runs anywhere and is unit tested
 * (tests/unit/search-parse.test.ts).
 */

export type SearchKind =
  'graded' | 'practice' | 'note' | 'formula_sheet' | 'exam_prep' | 'week' | 'page'

export type CourseAliasEntry = {
  id: string
  programSlug: string
  slug: string
  shortName: string
  /** Name, short name, code and aliases. */
  terms: string[]
}

export type ParsedCourse = { id: string; programSlug: string; slug: string; shortName: string }

export type ParsedQuery = {
  /** Lowercased, whitespace-collapsed original query (used for analytics). */
  normalized: string
  /** What is left for full-text search after filters are extracted. */
  text: string
  week: number | null
  kind: SearchKind | null
  course: ParsedCourse | null
  /** Other courses the same words name (e.g. "maths 1" in another programme). */
  alternatives: ParsedCourse[]
}

/** Words that describe intent rather than content and would break FTS. */
const FILLER = new Set([
  'iitm',
  'iit',
  'madras',
  'bs',
  'bsc',
  'degree',
  'online',
  'qualifier',
  'answers',
  'answer',
  'solutions',
  'solution',
  'solved',
  'key',
  'pdf',
  'free',
  'download',
  'the',
  'for',
  'of',
  'in',
  'and',
  'with',
  'how',
  'to',
  'what',
  'is',
  'a',
  'an',
  'program',
  'programme',
  'course',
  '2024',
  '2025',
  '2026',
  '2027',
])

const KIND_PATTERNS: Array<[SearchKind, RegExp]> = [
  ['formula_sheet', /\b(formula(?:e|s)?(?:\s+sheets?)?|cheat\s*sheets?)\b/],
  [
    'exam_prep',
    /\b(exam\s*prep(?:aration)?|revision|one\s*shot|mock(?:\s+tests?)?|pyqs?|previous\s+year(?:\s+papers?)?)\b/,
  ],
  ['practice', /\b(pa|practice(?:\s+assignments?)?)\b/],
  ['graded', /\b(ga|gas|graded(?:\s+assignments?)?|assignments?)\b/],
  ['note', /\b(notes?|summary|summaries)\b/],
]

const WEEK_PATTERN = /\b(?:week|wk|w)\s*-?\s*(\d{1,2})\b/

export function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9+#&\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200)
}

/** "Maths 1" → "maths 1"; "BSMA1001" → "bsma1001"; "EST&C" → "est c". */
function normalizeTerm(term: string): string {
  return normalizeQuery(term.replace(/&/g, ' ')).replace(/[-&]/g, ' ').replace(/\s+/g, ' ').trim()
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Matches a term as whole words, allowing "maths1" for "maths 1". */
function termPattern(term: string): RegExp {
  const words = term.split(' ').map(escapeRegExp)
  return new RegExp(`(?:^|\\s)(${words.join('\\s*')})(?=\\s|$)`)
}

export function parseSearchQuery(query: string, courses: CourseAliasEntry[] = []): ParsedQuery {
  const normalized = normalizeQuery(query)
  let rest = ` ${normalized.replace(/-/g, ' ')} `

  // Week number
  let week: number | null = null
  const weekMatch = WEEK_PATTERN.exec(rest)
  if (weekMatch) {
    const n = Number(weekMatch[1])
    if (n >= 1 && n <= 16) {
      week = n
      rest = rest.replace(weekMatch[0], ' ')
    }
  }

  // Content kind
  let kind: SearchKind | null = null
  for (const [candidate, pattern] of KIND_PATTERNS) {
    const match = pattern.exec(rest)
    if (match) {
      kind = candidate
      rest = rest.replace(match[0], ' ')
      break
    }
  }

  // Course alias: the longest matching term wins. When the same words name
  // courses in several programmes ("english 1", "maths 1"), the first in
  // `courses` order (programme order) is chosen and the rest are offered as
  // alternatives.
  let best: { length: number; matched: string; entries: CourseAliasEntry[] } | null = null
  for (const entry of courses) {
    for (const raw of entry.terms) {
      const term = normalizeTerm(raw)
      if (term.length < 2) continue
      const match = termPattern(term).exec(rest)
      if (!match) continue
      if (!best || term.length > best.length) {
        best = { length: term.length, matched: match[1]!, entries: [entry] }
      } else if (term.length === best.length && !best.entries.includes(entry)) {
        best.entries.push(entry)
      }
    }
  }

  const toCourse = (entry: CourseAliasEntry): ParsedCourse => ({
    id: entry.id,
    programSlug: entry.programSlug,
    slug: entry.slug,
    shortName: entry.shortName,
  })
  const course = best ? toCourse(best.entries[0]!) : null
  const alternatives = best ? best.entries.slice(1).map(toCourse) : []
  if (best) rest = rest.replace(best.matched, ' ')

  const text = rest
    .split(/\s+/)
    .filter((word) => word.length > 0 && !FILLER.has(word))
    .join(' ')

  return { normalized, text, week, kind, course, alternatives }
}
