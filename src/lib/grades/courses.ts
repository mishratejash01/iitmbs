import { DS_COURSES } from './courses-ds'
import { ES_COURSES } from './courses-es'
import type { GradeCourse } from './types'

/** The grading documents the formulas come from (the latest public versions). */
export const GRADING_TERM = 'January 2026'

export const GRADE_COURSES: GradeCourse[] = [...DS_COURSES, ...ES_COURSES]
