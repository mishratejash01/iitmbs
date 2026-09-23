import { describe, expect, it } from 'vitest'

import { parseFieldValue, toIstInput, fromIstInput, type Field } from '@/lib/admin/fields'
import { checkQuality } from '@/lib/admin/quality'
import { getResource } from '@/lib/admin/resources'

const notes = getResource('notes')!
const assignments = getResource('assignments')!

describe('quality gate', () => {
  it('flags thin notes, missing meta, missing alt text and missing internal links', () => {
    const warnings = checkQuality({
      config: notes,
      record: { body_mdx: 'Short note ![](cloudinary:x)', source_permission: 'original' },
      minWords: 300,
      duplicateTitle: true,
      mdxProblems: [{ field: 'body_mdx', message: 'Parse error' }],
    })
    expect(warnings.map((w) => w.code).sort()).toEqual([
      'alt',
      'duplicate',
      'links',
      'mdx',
      'meta',
      'thin',
    ])
  })

  it('passes a substantial, linked, described note', () => {
    const body = `${'word '.repeat(320)}\n\nSee [week 2](/data-science/maths-1/week-2).`
    const warnings = checkQuality({
      config: notes,
      record: { body_mdx: body, summary: 'A summary', source_permission: 'original' },
      minWords: 300,
      duplicateTitle: false,
      mdxProblems: [],
    })
    expect(warnings).toEqual([])
  })

  it('warns about unscheduled solution releases on graded assignments', () => {
    const warnings = checkQuality({
      config: assignments,
      record: {
        type: 'graded',
        solutions_release_at: '2099-01-01T00:00:00+05:30',
        summary: 'x',
        intro_mdx: '',
      },
      minWords: 300,
      duplicateTitle: false,
      mdxProblems: [],
    })
    expect(warnings.map((w) => w.code)).toEqual(expect.arrayContaining(['release', 'due']))
  })
})

describe('field parsing', () => {
  const field = (overrides: Partial<Field>): Field => ({
    name: 'x',
    label: 'X',
    type: 'text',
    ...overrides,
  })

  it('converts IST datetime inputs to offset timestamps and back', () => {
    expect(fromIstInput('2026-10-02T23:59')).toBe('2026-10-02T23:59:00+05:30')
    expect(toIstInput('2026-10-02T18:29:00Z')).toBe('2026-10-02T23:59')
  })

  it('parses tags, numbers, booleans, slugs and coerced selects', () => {
    expect(parseFieldValue(field({ type: 'tags' }), 'maths 1, math 1\nm1, maths 1')).toEqual({
      ok: true,
      value: ['maths 1', 'math 1', 'm1'],
    })
    expect(parseFieldValue(field({ type: 'number' }), '42')).toEqual({ ok: true, value: 42 })
    expect(parseFieldValue(field({ type: 'boolean' }), 'on')).toEqual({ ok: true, value: true })
    expect(parseFieldValue(field({ type: 'slug' }), 'Maths 1').ok).toBe(false)
    expect(
      parseFieldValue(
        field({ type: 'select', coerce: 'number', options: [{ value: '301', label: '301' }] }),
        '301',
      ),
    ).toEqual({ ok: true, value: 301 })
    expect(parseFieldValue(field({ type: 'text', required: true }), '')).toEqual({
      ok: false,
      error: 'Required',
    })
  })
})

describe('csv parser', async () => {
  const { parseCsv } = await import('@/lib/admin/csv')
  it('handles quotes, escaped quotes, commas and newlines inside fields', () => {
    const rows = parseCsv(
      'position,question_mdx,source_permission\r\n1,"What is $A \\cup B$, given ""x""?",original\n2,"Line one\nline two",original\n',
    )
    expect(rows).toEqual([
      {
        position: '1',
        question_mdx: 'What is $A \\cup B$, given "x"?',
        source_permission: 'original',
      },
      { position: '2', question_mdx: 'Line one\nline two', source_permission: 'original' },
    ])
  })
})

describe('csv export cells', async () => {
  const { csvCell, parseCsv } = await import('@/lib/admin/csv')
  it('quotes separators and neutralises spreadsheet formulas', () => {
    expect(csvCell('plain')).toBe('plain')
    expect(csvCell('a, b')).toBe('"a, b"')
    expect(csvCell('say "hi"')).toBe('"say ""hi"""')
    expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`)
    expect(csvCell('@SUM(A1)')).toBe("'@SUM(A1)")
    expect(csvCell(-12.5)).toBe('-12.5')
    expect(csvCell(null)).toBe('')
  })
  it('round-trips through the parser', () => {
    const text = [
      'title,note',
      [csvCell('Maths 1, Week 2'), csvCell('line\nbreak')].join(','),
    ].join('\n')
    expect(parseCsv(text)).toEqual([{ title: 'Maths 1, Week 2', note: 'line\nbreak' }])
  })
})
