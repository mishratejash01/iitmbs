import { describe, expect, it } from 'vitest'

import { courseResult, letterFor, marksNeeded } from '@/lib/grades/calculate'
import { compileFormula } from '@/lib/grades/formula'
import type { GradeCourse } from '@/lib/grades/types'

const maths1: GradeCourse = {
  id: 'ds-maths-1',
  program: 'ds',
  level: 'foundation',
  name: 'Mathematics for Data Science I',
  code: 'BSMA1001',
  components: [
    { key: 'Qz1', label: 'Quiz 1', max: 100 },
    { key: 'Qz2', label: 'Quiz 2', max: 100 },
  ],
  final: { key: 'F', label: 'End term', max: 100 },
  formula: 'max(0.6*F + 0.3*max(Qz1, Qz2), 0.45*F + 0.25*Qz1 + 0.3*Qz2)',
  display: 'T = max(0.6F + 0.3 max(Qz1, Qz2), 0.45F + 0.25Qz1 + 0.3Qz2)',
  bonusMax: 5,
  conditions: [],
  notes: [],
}

describe('compileFormula', () => {
  it('evaluates arithmetic, max and min with precedence', () => {
    expect(compileFormula('0.6*F + 0.3*max(Qz1, Qz2)').evaluate({ F: 50, Qz1: 40, Qz2: 80 })).toBe(
      54,
    )
    expect(compileFormula('min(A, 40) + -2 * (B - 1) / 2').evaluate({ A: 55, B: 3 })).toBe(38)
    expect(compileFormula('F >= 10').evaluate({ F: 10 })).toBe(1)
    expect(compileFormula('F >= 10').evaluate({ F: 9.5 })).toBe(0)
  })

  it('lists the names it reads and treats missing ones as 0', () => {
    const formula = compileFormula('max(PE1, PE2) + GAA')
    expect(formula.names.sort()).toEqual(['GAA', 'PE1', 'PE2'])
    expect(formula.evaluate({ PE1: 30 })).toBe(30)
  })

  it('rejects anything outside the grammar', () => {
    expect(() => compileFormula('alert(1)')).toThrow()
    expect(() => compileFormula('F; process')).toThrow()
    expect(() => compileFormula('0.6F')).toThrow()
  })
})

describe('courseResult', () => {
  it('grades by the absolute bands', () => {
    expect(letterFor(90)).toBe('S')
    expect(letterFor(89.99)).toBe('A')
    expect(letterFor(40)).toBe('E')
    expect(letterFor(39.9)).toBe('U')
  })

  it('adds bonus only after passing, capped at 100', () => {
    const scores = { Qz1: 60, Qz2: 70, F: 70 }
    // max(42 + 21, 31.5 + 15 + 21) = 67.5
    expect(courseResult(maths1, scores, 5)).toMatchObject({ base: 67.5, total: 72.5, grade: 'B' })
    expect(courseResult(maths1, { F: 30 }, 5)).toMatchObject({
      base: 18,
      total: 18,
      passed: false,
      grade: 'U',
    })
    expect(courseResult(maths1, { Qz1: 100, Qz2: 100, F: 100 }, 5).total).toBe(100)
  })

  it('fails a course whose extra condition is not met', () => {
    const course = { ...maths1, conditions: [{ expr: 'F >= 40', text: 'End term at least 40' }] }
    const result = courseResult(course, { Qz1: 100, Qz2: 100, F: 35 })
    expect(result.passed).toBe(false)
    expect(result.unmet).toEqual(['End term at least 40'])
  })
})

describe('marksNeeded', () => {
  it('finds the lowest end term score for each grade', () => {
    const needed = Object.fromEntries(
      marksNeeded(maths1, { Qz1: 60, Qz2: 70 }).map((row) => [row.letter, row.needed]),
    )
    // T = max(0.6F + 21, 0.45F + 36). E: F >= 8.89; A: F >= 97.78; S: out of reach (max T is 81).
    expect(needed.E).toBe(8.9)
    expect(needed.S).toBeNull()
    expect(needed.A).toBe(97.8)
  })

  it('counts bonus marks towards higher grades', () => {
    // A with 5 bonus marks needs base T >= 75: 0.45F + 36 >= 75 → F >= 86.67.
    const withBonus = marksNeeded(maths1, { Qz1: 60, Qz2: 70 }, 5).find((row) => row.letter === 'A')
    expect(withBonus?.needed).toBe(86.7)
  })

  it('returns nothing for a course without an end term', () => {
    expect(marksNeeded({ ...maths1, final: null }, {})).toEqual([])
  })
})
