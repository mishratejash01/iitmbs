import { describe, expect, it } from 'vitest'

import { QUIZSPACE_ORIGIN, quizSpaceCourseUrl, quizSpaceRedirects } from '@/lib/quizspace'

describe('quizSpaceCourseUrl', () => {
  it('maps our course slug to QuizSpace, with or without an exam', () => {
    expect(quizSpaceCourseUrl('stats-1')).toBe(`${QUIZSPACE_ORIGIN}/pyq/statistics-1`)
    expect(quizSpaceCourseUrl('mad-1', 'quiz-2')).toBe(`${QUIZSPACE_ORIGIN}/pyq/mad-1/quiz-2`)
  })

  it('returns null for a course QuizSpace does not have', () => {
    expect(quizSpaceCourseUrl('no-such-course')).toBeNull()
  })
})

describe('quizSpaceRedirects', () => {
  const rules = quizSpaceRedirects()

  it('is permanent and leaves this site for QuizSpace only', () => {
    for (const rule of rules) {
      expect(rule.permanent).toBe(true)
      expect(rule.source.startsWith('/pyq')).toBe(true)
      expect(rule.destination.startsWith(`${QUIZSPACE_ORIGIN}/`)).toBe(true)
    }
  })

  it('sends the index and exam hubs to their QuizSpace equivalents', () => {
    expect(rules[0]).toMatchObject({ source: '/pyq', destination: `${QUIZSPACE_ORIGIN}/` })
    expect(rules[1]?.destination).toBe(`${QUIZSPACE_ORIGIN}/exam/:exam`)
  })

  it('covers old course-code aliases and ends with a catch-all', () => {
    expect(rules.some((rule) => rule.source.includes('|bsma1002|'))).toBe(true)
    expect(rules.at(-1)).toMatchObject({
      source: '/pyq/:rest+',
      destination: `${QUIZSPACE_ORIGIN}/`,
    })
  })
})
