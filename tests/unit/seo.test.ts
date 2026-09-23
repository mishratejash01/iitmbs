import { describe, expect, it } from 'vitest'

import { mdxToPlainText, truncate } from '@/lib/mdx/plain'
import { absoluteUrl, assignmentPath, formatTerm, parseWeekSegment, termSortKey, weekNotesPath } from '@/lib/routes'
import { fillTemplate } from '@/lib/seo/templates'
import { parseSiteSettings } from '@/lib/settings/schema'

describe('routes', () => {
  it('builds canonical paths that match the SQL routing views', () => {
    expect(assignmentPath('data-science', 'maths-1', 2, 'graded')).toBe('/data-science/maths-1/week-2/graded-assignment')
    expect(assignmentPath('data-science', 'maths-1', 2, 'practice', '2026-may')).toBe(
      '/data-science/maths-1/week-2/practice-assignment/2026-may',
    )
    expect(weekNotesPath('electronic-systems', 'estc', 4)).toBe('/electronic-systems/estc/week-4/notes')
  })

  it('parses week segments strictly', () => {
    expect(parseWeekSegment('week-3')).toBe(3)
    expect(parseWeekSegment('week-0')).toBeNull()
    expect(parseWeekSegment('week-17')).toBeNull()
    expect(parseWeekSegment('notes')).toBeNull()
  })

  it('orders and formats terms', () => {
    expect(termSortKey('2026-sep')).toBeGreaterThan(termSortKey('2026-may'))
    expect(termSortKey('2027-jan')).toBeGreaterThan(termSortKey('2026-sep'))
    expect(formatTerm('2026-sep')).toBe('September 2026')
  })

  it('builds absolute URLs without trailing slashes', () => {
    expect(absoluteUrl('https://example.com', '/')).toBe('https://example.com')
    expect(absoluteUrl('https://example.com', '/a/b')).toBe('https://example.com/a/b')
  })
})

describe('templates and text', () => {
  it('fills templates and falls back when a value is missing', () => {
    expect(fillTemplate('IITM {short} Week {n} Graded Assignment {year}', { short: 'Maths 1', n: 2, year: '2026' }, 'x')).toBe(
      'IITM Maths 1 Week 2 Graded Assignment 2026',
    )
    expect(fillTemplate('{short} {missing}', { short: 'CT' }, 'fallback')).toBe('fallback')
    expect(fillTemplate(null, {}, 'fallback')).toBe('fallback')
  })

  it('converts MDX to plain text for meta tags', () => {
    expect(mdxToPlainText('## Hi\n\n**Bold** [link](/x) $x^2$ <Callout type="tip">t</Callout>')).toBe('Hi Bold link x^2 t')
    expect(truncate('one two three four five', 12)).toBe('one two…')
  })
})

describe('site settings', () => {
  it('fills every default for an empty or malformed document', () => {
    const settings = parseSiteSettings({ features: 'broken', announcement: { enabled: 'yes', tone: 'loud' } })
    expect(settings.site_name).toBe('Qualifier Hub')
    expect(settings.features.login).toBe(true)
    expect(settings.announcement).toMatchObject({ enabled: false, tone: 'info' })
    expect(settings.theme).toEqual({})
    expect(settings.revalidate_seconds).toBe(3600)
  })

  it('keeps valid values', () => {
    const settings = parseSiteSettings({ site_name: 'Hub', current_term: '2026-sep', revalidate_seconds: 120 })
    expect(settings).toMatchObject({ site_name: 'Hub', current_term: '2026-sep', revalidate_seconds: 120 })
  })
})
