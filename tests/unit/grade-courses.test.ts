import { describe, expect, it } from 'vitest'

import { GRADE_COURSES } from '@/lib/grades/courses'
import { compileFormula } from '@/lib/grades/formula'

const full = (course: (typeof GRADE_COURSES)[number]) =>
  Object.fromEntries(
    [...course.components, ...(course.final ? [course.final] : [])].map((c) => [c.key, c.max]),
  )

describe('grade course data', () => {
  it('has unique ids', () => {
    const ids = GRADE_COURSES.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^(ds|es)-[a-z0-9-]+$/)
  })

  for (const course of GRADE_COURSES) {
    describe(course.id, () => {
      const keys = new Set(
        [...course.components, ...(course.final ? [course.final] : [])].map((c) => c.key),
      )

      it('uses only its own scores', () => {
        const formula = compileFormula(course.formula)
        for (const name of formula.names)
          expect(keys, `${name} in ${course.formula}`).toContain(name)
        for (const condition of course.conditions)
          for (const name of compileFormula(condition.expr).names) expect(keys).toContain(name)
      })

      it('reads every score it asks for', () => {
        const used = new Set([
          ...compileFormula(course.formula).names,
          ...course.conditions.flatMap((c) => compileFormula(c.expr).names),
        ])
        for (const key of keys) expect(used, key).toContain(key)
      })

      it('gives 100 for full marks and 0 for none', () => {
        const formula = compileFormula(course.formula)
        expect(formula.evaluate(full(course))).toBeCloseTo(100, 1)
        expect(formula.evaluate({})).toBe(0)
      })

      it('has pass conditions that are comparisons', () => {
        for (const condition of course.conditions) {
          const value = compileFormula(condition.expr).evaluate(full(course))
          expect([0, 1]).toContain(value)
        }
      })
    })
  }
})
