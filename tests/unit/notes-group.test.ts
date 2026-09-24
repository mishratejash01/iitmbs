import { describe, expect, it } from 'vitest'

import type { ResourceItem } from '@/lib/data/types'
import { groupNotes } from '@/lib/notes/group'

const note = (id: string, title: string): ResourceItem => ({
  id,
  kind: 'link',
  title,
  description: null,
  requiresLogin: false,
  fileFormat: null,
  fileBytes: null,
  isExternal: true,
  host: 'drive.google.com',
  downloadCount: 0,
  contributor: null,
})

describe('groupNotes', () => {
  it('orders single weeks first, then multi-week, exam, practice, sheets, books, videos and the rest', () => {
    const groups = groupNotes(
      [
        note('a', 'Book 1'),
        note('b', 'Week 10'),
        note('c', 'Weeks 1 to 12'),
        note('d', 'Week 2'),
        note('e', 'Summary'),
        note('f', 'Formula sheet'),
        note('g', 'Quiz 1'),
        note('h', 'Week 2'),
        note('i', 'OPPE 1 questions and solutions'),
        note('j', 'Intro to Linux TA session recording'),
        note('k', 'Vim cheat sheet'),
      ],
      'MLT',
    )
    expect(groups.map((g) => g.id)).toEqual([
      'week-2',
      'week-10',
      'multi-week',
      'exam-revision',
      'oppe-practice',
      'formula-sheets',
      'books',
      'videos',
      'more-notes',
    ])
    expect(groups.find((g) => g.id === 'formula-sheets')?.items.map((n) => n.id)).toEqual([
      'f',
      'k',
    ])
    expect(groups[0]).toMatchObject({ heading: 'MLT week 2 notes' })
    expect(groups[0]?.items.map((n) => n.id)).toEqual(['d', 'h'])
  })
})
