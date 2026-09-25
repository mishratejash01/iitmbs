import { describe, expect, it } from 'vitest'

import { buildLevels } from '@/lib/home/levels'

const hubCourse = (shortName: string, path: string) => ({
  id: shortName,
  slug: shortName,
  name: shortName,
  shortName,
  code: null,
  description: null,
  weeksCount: 4,
  path,
  homeProgram: null,
})

describe('buildLevels', () => {
  const levels = buildLevels({
    programPages: [
      {
        courses: [hubCourse('Maths 1', '/data-science/maths-1'), hubCourse('English 1', '/ds/e1')],
      },
      { courses: [hubCourse('English 1', '/es/e1'), hubCourse('ESTC', '/es/estc')] },
    ],
    noteCourses: [
      {
        code: 'BSMA1002',
        slug: 'maths-2',
        shortName: 'Maths 2',
        path: '/notes/maths-2',
        level: 'foundation',
        noteCount: 12,
      },
    ],
    pyqCourses: [
      {
        code: 'BSMA1002',
        slug: 'maths-2',
        shortName: 'Maths 2',
        path: '/pyq/maths-2',
        level: 'foundation',
        paperCount: 8,
        examCounts: { 'quiz-1': 8 },
      },
      {
        code: 'BSMA1001',
        slug: 'maths-1',
        shortName: 'Maths 1',
        path: '/pyq/maths-1',
        level: 'foundation',
        paperCount: 10,
        examCounts: { qualifier: 4, 'end-term': 6 },
      },
    ],
  })

  it('starts with the qualifier and drops empty levels', () => {
    expect(levels.map((level) => level.id)).toEqual(['qualifier', 'foundation'])
  })

  it('lists each qualifier course once and counts past qualifier papers', () => {
    const [qualifier] = levels
    expect(qualifier?.courses).toEqual([
      { name: 'Maths 1', href: '/data-science/maths-1' },
      { name: 'English 1', href: '/ds/e1' },
      { name: 'ESTC', href: '/es/estc' },
    ])
    expect(qualifier?.paperCount).toBe(4)
  })

  it('prefers notes over papers, sorts by name and totals each level', () => {
    const foundation = levels[1]
    expect(foundation?.courses).toEqual([
      { name: 'Maths 1', href: '/pyq/maths-1' },
      { name: 'Maths 2', href: '/notes/maths-2' },
    ])
    expect(foundation?.noteCount).toBe(12)
    expect(foundation?.paperCount).toBe(18)
  })
})
