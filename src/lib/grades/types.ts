/** One score a student enters, out of `max`. */
export type GradeComponent = {
  /** Name used in the formula, e.g. "Qz1". */
  key: string
  /** What students call it, e.g. "Quiz 1". */
  label: string
  /** Highest possible score: 100 unless the grading document says otherwise. */
  max: number
}

/** A course's grading rule, transcribed from a term's official grading document. */
export type GradeCourse = {
  /** Stable id, e.g. "ds-maths-1". */
  id: string
  program: 'ds' | 'es'
  level: 'foundation' | 'diploma' | 'degree'
  /** Course name as students know it. */
  name: string
  /** IIT Madras course code, when known (e.g. "BSMA1001"). */
  code: string | null
  /** Scores known before the end term: quizzes, assignments, OPPEs, projects. */
  components: GradeComponent[]
  /** The end term exam, or null for a course graded without one. */
  final: GradeComponent | null
  /**
   * The total course score T before bonus, over the component keys (see
   * formula.ts): numbers, + - * /, brackets, max() and min().
   */
  formula: string
  /** The formula as the grading document writes it, shown to students. */
  display: string
  /** Bonus marks added to T only once the course is passed (T is capped at 100). */
  bonusMax: number
  /** Further conditions to pass, e.g. { expr: "F >= 10", text: "End term at least 10 out of 40" }. */
  conditions: Array<{ expr: string; text: string }>
  /** Short notes shown with the result, e.g. eligibility rules. */
  notes: string[]
}
