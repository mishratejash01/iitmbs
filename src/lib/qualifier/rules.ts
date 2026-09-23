/**
 * The published qualifier rules as pure functions. The numbers themselves
 * (cut-offs, "best 2 of the first 3", course-load bands) come from
 * site_settings.qualifier, so a rule change is an admin edit.
 *
 * Unit tested in tests/unit/qualifier-rules.test.ts.
 */

export type Category = {
  id: string
  label: string
  ga_min: number
  course_min: number
  average_min: number
}

export type QualifierRules = {
  ga_rule: { best_of: number; first_weeks: number }
  categories: Category[]
  course_load: Array<{ from: number; to: number; courses: number }>
}

const clamp = (value: number) => Math.min(100, Math.max(0, value))
const round = (value: number) => Math.round(value * 100) / 100

/**
 * Average of the best `best_of` scores among the first `first_weeks` weeks.
 * Missing or blank scores count as 0 — exactly like an unattempted GA.
 */
export function gaAverage(scores: Array<number | null | undefined>, rule: QualifierRules['ga_rule']): number {
  const considered = Array.from({ length: rule.first_weeks }, (_, i) => clamp(Number(scores[i] ?? 0) || 0))
  const best = [...considered].sort((a, b) => b - a).slice(0, rule.best_of)
  return best.length === 0 ? 0 : round(best.reduce((sum, value) => sum + value, 0) / best.length)
}

export type EligibilityResult = {
  courses: Array<{ name: string; average: number; required: number; passes: boolean; shortfall: number }>
  eligible: boolean
}

/** Hall-ticket check: every course's GA average must reach the category cut-off. */
export function evaluateEligibility(
  courses: Array<{ name: string; scores: Array<number | null | undefined> }>,
  category: Category,
  rules: QualifierRules,
): EligibilityResult {
  const results = courses.map((course) => {
    const average = gaAverage(course.scores, rules.ga_rule)
    return {
      name: course.name,
      average,
      required: category.ga_min,
      passes: average >= category.ga_min,
      shortfall: round(Math.max(0, category.ga_min - average)),
    }
  })
  return { courses: results, eligible: results.length > 0 && results.every((r) => r.passes) }
}

export type ExamResult = {
  courses: Array<{ name: string; score: number; required: number; passes: boolean }>
  average: number
  averageRequired: number
  averagePasses: boolean
  qualified: boolean
  /** Courses allowed in the first term, when qualified. */
  courseLoad: number | null
}

/** Qualifier exam check: minimum in each course and a minimum average. */
export function evaluateExam(
  courses: Array<{ name: string; score: number | null | undefined }>,
  category: Category,
  rules: QualifierRules,
): ExamResult {
  const scored = courses.map((course) => {
    const score = clamp(Number(course.score ?? 0) || 0)
    return { name: course.name, score, required: category.course_min, passes: score >= category.course_min }
  })
  const average = scored.length === 0 ? 0 : round(scored.reduce((sum, c) => sum + c.score, 0) / scored.length)
  const averagePasses = average >= category.average_min
  const qualified = scored.length > 0 && averagePasses && scored.every((c) => c.passes)
  return {
    courses: scored,
    average,
    averageRequired: category.average_min,
    averagePasses,
    qualified,
    courseLoad: qualified ? courseLoadFor(average, rules) : null,
  }
}

/**
 * Courses allowed in the first term for an average score. Bands are
 * [from, to) except the last, which includes its upper bound (100).
 */
export function courseLoadFor(average: number, rules: QualifierRules): number | null {
  const bands = [...rules.course_load].sort((a, b) => a.from - b.from)
  for (const [index, band] of bands.entries()) {
    const last = index === bands.length - 1
    if (average >= band.from && (average < band.to || (last && average <= band.to))) return band.courses
  }
  return null
}
