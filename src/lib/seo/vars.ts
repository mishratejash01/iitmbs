import type { CourseCore } from '@/lib/data/courses'
import type { AssignmentSummary, WeekSummary } from '@/lib/data/types'
import { formatTerm } from '@/lib/routes'

import type { TemplateVars } from './templates'

/** Template variables shared by course-level pages. */
export function courseVars(core: CourseCore): TemplateVars {
  return {
    program: core.course.program.shortName,
    program_name: core.course.program.name,
    course: core.course.name,
    short: core.course.shortName,
    code: core.course.code,
    weeks: core.course.weeksCount,
  }
}

export function weekVars(core: CourseCore, week: WeekSummary): TemplateVars {
  return { ...courseVars(core), n: week.number, week_title: week.title }
}

export function assignmentVars(
  core: CourseCore,
  week: WeekSummary,
  assignment: AssignmentSummary,
): TemplateVars {
  return {
    ...weekVars(core, week),
    term: assignment.term,
    term_label: formatTerm(assignment.term),
    year: assignment.term.split('-')[0],
  }
}
