import { describe, expect, it } from 'vitest'

import { normalizeQuery, parseSearchQuery, type CourseAliasEntry } from '@/lib/search/parse'

const courses: CourseAliasEntry[] = [
  { id: 'm1', programSlug: 'data-science', slug: 'maths-1', shortName: 'Maths 1', terms: ['Mathematics for Data Science I', 'Maths 1', 'BSMA1001', 'maths 1', 'math 1', 'mathematics 1', 'm1'] },
  { id: 's1', programSlug: 'data-science', slug: 'stats-1', shortName: 'Stats 1', terms: ['Statistics for Data Science I', 'Stats 1', 'stats 1', 'statistics 1'] },
  { id: 'ct', programSlug: 'data-science', slug: 'computational-thinking', shortName: 'CT', terms: ['Computational Thinking', 'CT', 'ct'] },
  { id: 'e1', programSlug: 'data-science', slug: 'english-1', shortName: 'English 1', terms: ['English I', 'english 1'] },
  { id: 'e2', programSlug: 'electronic-systems', slug: 'english-1', shortName: 'English 1', terms: ['English I', 'english 1', 'es english'] },
]

describe('parseSearchQuery', () => {
  it('understands course alias, week and graded-assignment intent', () => {
    const parsed = parseSearchQuery('math 1 week 2 ga', courses)
    expect(parsed.course?.slug).toBe('maths-1')
    expect(parsed.week).toBe(2)
    expect(parsed.kind).toBe('graded')
    expect(parsed.text).toBe('')
  })

  it('handles squashed spellings and filler words', () => {
    const parsed = parseSearchQuery('IITM maths1 wk3 graded assignment answers 2026', courses)
    expect(parsed.course?.slug).toBe('maths-1')
    expect(parsed.week).toBe(3)
    expect(parsed.kind).toBe('graded')
    expect(parsed.text).toBe('')
  })

  it('detects notes, formula sheets and practice', () => {
    expect(parseSearchQuery('ct notes week 4', courses)).toMatchObject({ kind: 'note', week: 4 })
    expect(parseSearchQuery('stats 1 formula sheet', courses)).toMatchObject({ kind: 'formula_sheet' })
    expect(parseSearchQuery('stats 1 week 1 practice assignment', courses).kind).toBe('practice')
  })

  it('leaves ambiguous courses unresolved and keeps the words for text search', () => {
    const parsed = parseSearchQuery('english 1 week 2', courses)
    expect(parsed.course).toBeNull()
    expect(parsed.text).toBe('english 1')
    expect(parseSearchQuery('es english week 2', courses).course?.id).toBe('e2')
  })

  it('keeps topic words for full-text search', () => {
    expect(parseSearchQuery('quartiles and percentiles', courses).text).toBe('quartiles percentiles')
  })

  it('normalises input safely', () => {
    expect(normalizeQuery('  Mäths   1!!  <script> ')).toBe('maths 1 script')
  })
})
