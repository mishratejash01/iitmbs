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
      { shortName: 'Maths 2', path: '/notes/maths-2', level: 'foundation', noteCount: 12 },
    ],
    lectureCourses: [
      {
        shortName: 'Maths 2',
        path: '/resources/lectures/maths-2',
        level: 'foundation',
        videoCount: 40,
      },
      {
        shortName: 'Maths 1',
        path: '/resources/lectures/maths-1',
        level: 'foundation',
        videoCount: 50,
      },
    ],
  })

  it('starts with the qualifier and drops empty levels', () => {
    expect(levels.map((level) => level.id)).toEqual(['qualifier', 'foundation'])
  })

  it('lists each qualifier course once', () => {
    const [qualifier] = levels
    expect(qualifier?.courses).toEqual([
      { name: 'Maths 1', href: '/data-science/maths-1' },
      { name: 'English 1', href: '/ds/e1' },
      { name: 'ESTC', href: '/es/estc' },
    ])
  })

  it('prefers notes over lectures, sorts by name and totals each level', () => {
    const foundation = levels[1]
    expect(foundation?.courses).toEqual([
      { name: 'Maths 1', href: '/resources/lectures/maths-1' },
      { name: 'Maths 2', href: '/notes/maths-2' },
    ])
    expect(foundation?.noteCount).toBe(12)
    expect(foundation?.videoCount).toBe(90)
  })
})
