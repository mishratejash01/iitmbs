import { compileFormula } from './formula'
import type { GradeCourse } from './types'

/** A course is passed when the total course score T reaches 40 (and any course conditions hold). */
export const PASS_MARK = 40

/** IIT Madras BS letter grades: absolute bands on T, with grade points. */
export const GRADE_BANDS = [
  { letter: 'S', min: 90, points: 10 },
  { letter: 'A', min: 80, points: 9 },
  { letter: 'B', min: 70, points: 8 },
  { letter: 'C', min: 60, points: 7 },
  { letter: 'D', min: 50, points: 6 },
  { letter: 'E', min: 40, points: 4 },
] as const

export type GradeLetter = (typeof GRADE_BANDS)[number]['letter'] | 'U'

export type CourseResult = {
  /** T from the formula, before bonus. */
  base: number
  /** T with any bonus (only once passed), capped at 100. */
  total: number
  passed: boolean
  grade: GradeLetter
  /** Course pass conditions that are not met. */
  unmet: string[]
}

export function letterFor(total: number): GradeLetter {
  return GRADE_BANDS.find((band) => total >= band.min - 1e-9)?.letter ?? 'U'
}

/** The total course score and grade for a full set of scores (missing scores count as 0). */
export function courseResult(
  course: GradeCourse,
  values: Record<string, number>,
  bonus = 0,
): CourseResult {
  const base = compileFormula(course.formula).evaluate(values)
  const unmet = course.conditions
    .filter((condition) => compileFormula(condition.expr).evaluate(values) !== 1)
    .map((condition) => condition.text)
  const passed = base >= PASS_MARK - 1e-9 && unmet.length === 0
  const extra = passed ? Math.min(Math.max(bonus, 0), course.bonusMax) : 0
  const total = Math.min(100, base + extra)
  return { base, total, passed, grade: passed ? letterFor(total) : 'U', unmet }
}

export type MarksNeeded = {
  letter: (typeof GRADE_BANDS)[number]['letter']
  /** End term marks needed (rounded up to 0.1), 0 when already secured, null when out of reach. */
  needed: number | null
}

/**
 * The lowest end term score that earns each grade, given the other scores.
 * T never falls as the end term score rises, so a binary search finds it.
 */
export function marksNeeded(
  course: GradeCourse,
  values: Record<string, number>,
  bonus = 0,
): MarksNeeded[] {
  const final = course.final
  if (!final) return []
  const reaches = (score: number, min: number) => {
    const result = courseResult(course, { ...values, [final.key]: score }, bonus)
    return result.passed && result.total >= min - 1e-9
  }
  return GRADE_BANDS.map(({ letter, min }) => {
    if (!reaches(final.max, min)) return { letter, needed: null }
    if (reaches(0, min)) return { letter, needed: 0 }
    let low = 0
    let high = final.max
    for (let i = 0; i < 40; i++) {
      const mid = (low + high) / 2
      if (reaches(mid, min)) high = mid
      else low = mid
    }
    let needed = Math.ceil(high * 10 - 1e-6) / 10
    if (!reaches(needed, min)) needed = Math.min(final.max, needed + 0.1)
    return { letter, needed: Math.round(needed * 10) / 10 }
  })
}
