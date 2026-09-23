import { describe, expect, it } from 'vitest'

import { courseLoadFor, evaluateEligibility, evaluateExam, gaAverage, type QualifierRules } from '@/lib/qualifier/rules'

const rules: QualifierRules = {
  ga_rule: { best_of: 2, first_weeks: 3 },
  categories: [
    { id: 'general', label: 'General', ga_min: 40, course_min: 40, average_min: 50 },
    { id: 'obc_ews', label: 'OBC-NCL / EWS', ga_min: 35, course_min: 35, average_min: 45 },
  ],
  course_load: [
    { from: 0, to: 50, courses: 2 },
    { from: 50, to: 70, courses: 3 },
    { from: 70, to: 100, courses: 4 },
  ],
}
const general = rules.categories[0]!

describe('qualifier rules', () => {
  it('averages the best two of the first three weeks, counting blanks as zero', () => {
    expect(gaAverage([70, 0, 55], rules.ga_rule)).toBe(62.5)
    expect(gaAverage([80, null, undefined], rules.ga_rule)).toBe(40)
    expect(gaAverage([100, 90, 95, 20], rules.ga_rule)).toBe(97.5)
    expect(gaAverage([150, -5, 50], rules.ga_rule)).toBe(75)
  })

  it('requires every course to clear the GA cut-off', () => {
    const result = evaluateEligibility(
      [
        { name: 'Maths 1', scores: [60, 40, 30] },
        { name: 'Stats 1', scores: [35, 30, 0] },
      ],
      general,
      rules,
    )
    expect(result.eligible).toBe(false)
    expect(result.courses[1]).toMatchObject({ average: 32.5, passes: false, shortfall: 7.5 })
  })

  it('needs both the per-course minimum and the average', () => {
    const failsOneCourse = evaluateExam(
      [
        { name: 'A', score: 90 },
        { name: 'B', score: 85 },
        { name: 'C', score: 80 },
        { name: 'D', score: 38 },
      ],
      general,
      rules,
    )
    expect(failsOneCourse.average).toBe(73.25)
    expect(failsOneCourse.qualified).toBe(false)

    const qualifies = evaluateExam([{ name: 'A', score: 55 }, { name: 'B', score: 60 }], general, rules)
    expect(qualifies.qualified).toBe(true)
    expect(qualifies.courseLoad).toBe(3)
  })

  it('maps averages to first-term course limits', () => {
    expect(courseLoadFor(49.99, rules)).toBe(2)
    expect(courseLoadFor(50, rules)).toBe(3)
    expect(courseLoadFor(70, rules)).toBe(4)
    expect(courseLoadFor(100, rules)).toBe(4)
  })
})
