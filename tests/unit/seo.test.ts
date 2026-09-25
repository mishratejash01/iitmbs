import { describe, expect, it } from 'vitest'

import { mdxToPlainText, truncate } from '@/lib/mdx/plain'
import {
  absoluteUrl,
  assignmentPath,
  formatTerm,
  parseWeekSegment,
  termSortKey,
  weekNotesPath,
} from '@/lib/routes'
import { fillTemplate } from '@/lib/seo/templates'
import { fitTitle, pickTitle, TITLE_LIMIT, withDigits, yearRange } from '@/lib/seo/title'
import { parseSiteSettings } from '@/lib/settings/schema'

describe('routes', () => {
  it('builds canonical paths that match the SQL routing views', () => {
    expect(assignmentPath('data-science', 'maths-1', 2, 'graded')).toBe(
      '/data-science/maths-1/week-2/graded-assignment',
    )
    expect(assignmentPath('data-science', 'maths-1', 2, 'practice', '2026-may')).toBe(
      '/data-science/maths-1/week-2/practice-assignment/2026-may',
    )
    expect(weekNotesPath('electronic-systems', 'estc', 4)).toBe(
      '/electronic-systems/estc/week-4/notes',
    )
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
    expect(
      fillTemplate(
        'IITM {short} Week {n} Graded Assignment {year}',
        { short: 'Maths 1', n: 2, year: '2026' },
        'x',
      ),
    ).toBe('IITM Maths 1 Week 2 Graded Assignment 2026')
    expect(fillTemplate('{short} {missing}', { short: 'CT' }, 'fallback')).toBe('fallback')
    expect(fillTemplate(null, {}, 'fallback')).toBe('fallback')
  })

  it('converts MDX to plain text for meta tags', () => {
    expect(
      mdxToPlainText('## Hi\n\n**Bold** [link](/x) $x^2$ <Callout type="tip">t</Callout>'),
    ).toBe('Hi Bold link x^2 t')
    expect(truncate('one two three four five', 12)).toBe('one two…')
  })
})

describe('site settings', () => {
  it('fills every default for an empty or malformed document', () => {
    const settings = parseSiteSettings({
      features: 'broken',
      announcement: { enabled: 'yes', tone: 'loud' },
    })
    expect(settings.site_name).toBe("IITM BS Students' Corner")
    expect(settings.features.login).toBe(true)
    expect(settings.announcement).toMatchObject({ enabled: false, tone: 'info' })
    expect(settings.theme).toEqual({})
    expect(settings.revalidate_seconds).toBe(3600)
  })

  it('keeps valid values', () => {
    const settings = parseSiteSettings({
      site_name: 'Hub',
      current_term: '2026-sep',
      revalidate_seconds: 120,
    })
    expect(settings).toMatchObject({
      site_name: 'Hub',
      current_term: '2026-sep',
      revalidate_seconds: 120,
    })
  })
})

describe('fitTitle', () => {
  const site = 'Qualifier Hub'

  it('keeps short titles and drops the brand suffix when it does not fit', () => {
    expect(fitTitle('IITM BS Notes | Qualifier Hub', site)).toBe('IITM BS Notes | Qualifier Hub')
    const long = 'IITM BS Notes: Free Handwritten and PDF Notes for Every Course | Qualifier Hub'
    expect(fitTitle(long, site)).toBe(
      'IITM BS Notes: Free Handwritten and PDF Notes for Every Course',
    )
  })

  it('falls back to the first shorter title that fits, with the suffix when there is room', () => {
    const long =
      'IITM BS PDSA PYQs: Programming, Data Structures and Algorithms using Python Previous Year Question Papers (BSCS2002) | Qualifier Hub'
    const result = fitTitle(long, site, [
      'IITM BS PDSA PYQs: Programming, Data Structures and Algorithms using Python',
      'IITM BS PDSA PYQs: Previous Year Question Papers (BSCS2002)',
    ])
    expect(result).toBe('IITM BS PDSA PYQs: Previous Year Question Papers (BSCS2002)')
    expect(result.length).toBeLessThanOrEqual(TITLE_LIMIT)
    expect(fitTitle(long, site, ['IITM BS PDSA PYQs (BSCS2002)'])).toBe(
      'IITM BS PDSA PYQs (BSCS2002) | Qualifier Hub',
    )
  })
})

describe('title helpers', () => {
  it('picks the first title within 65 characters, then within 70', () => {
    const long =
      'IITM BS Stats 1 PYQ: Statistics 1 Question Papers 2021 to 2025, All Exams Included'
    expect(
      pickTitle([
        long,
        'IITM BS Stats 1 PYQ: Previous Year Question Papers',
        'IITM BS Stats 1 PYQ',
      ]),
    ).toBe('IITM BS Stats 1 PYQ: Previous Year Question Papers')
    expect(pickTitle([false, null, 'IITM BS PDSA PYQ'])).toBe('IITM BS PDSA PYQ')
  })

  it('writes course numbers as digits and terms as a year range', () => {
    expect(withDigits('Statistics for Data Science II')).toBe('Statistics for Data Science 2')
    expect(withDigits('AI: Search Methods for Problem Solving')).toBe(
      'AI: Search Methods for Problem Solving',
    )
    expect(yearRange(['2021-sep', '2025-jan', '2023-may'])).toBe('2021 to 2025')
    expect(yearRange(['2024-sep'])).toBe('2024')
    expect(yearRange([])).toBeNull()
  })
})
