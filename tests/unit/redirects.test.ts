import { describe, expect, it } from 'vitest'

import { findRedirect, type RedirectMap } from '@/lib/redirects'

const map: RedirectMap = {
  exact: { '/old-guide': ['/qualifier/eligibility', 301] },
  programAliases: { ds: 'data-science' },
  courseAliases: {
    'data-science/math-1': '/data-science/maths-1',
    'data-science/ct': '/data-science/computational-thinking',
  },
  crossListed: { 'management-data-science/maths-1': '/data-science/maths-1' },
}

describe('findRedirect', () => {
  it('applies exact database redirects with their status', () => {
    expect(findRedirect('/old-guide', map)).toEqual({ to: '/qualifier/eligibility', status: 301 })
    expect(findRedirect('/old-guide/', map)).toEqual({ to: '/qualifier/eligibility', status: 301 })
  })

  it('maps course aliases and keeps the rest of the path', () => {
    expect(findRedirect('/data-science/math-1/week-2/graded-assignment', map)).toEqual({
      to: '/data-science/maths-1/week-2/graded-assignment',
      status: 308,
    })
  })

  it('maps programme aliases, alone or combined with course aliases', () => {
    expect(findRedirect('/ds', map)).toEqual({ to: '/data-science', status: 308 })
    expect(findRedirect('/ds/ct/week-1', map)).toEqual({
      to: '/data-science/computational-thinking/week-1',
      status: 308,
    })
  })

  it('sends cross-listed programme paths to the canonical course', () => {
    expect(findRedirect('/management-data-science/maths-1/week-3', map)).toEqual({
      to: '/data-science/maths-1/week-3',
      status: 308,
    })
  })

  it('returns null for unknown paths', () => {
    expect(findRedirect('/data-science/unknown', map)).toBeNull()
    expect(findRedirect('/', map)).toBeNull()
  })
})
