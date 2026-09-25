/**
 * Canonical URL builders. They mirror the SQL routing views
 * (supabase/migrations/*_routing.sql) exactly — tests/unit/routes.test.ts keeps
 * the two in step. Paths are lowercase, hyphenated and have no trailing slash.
 */

export type AssignmentKind = 'graded' | 'practice'

export const ASSIGNMENT_SEGMENT: Record<AssignmentKind, string> = {
  graded: 'graded-assignment',
  practice: 'practice-assignment',
}

export const WEEK_SEGMENT = /^week-([1-9]|1[0-6])$/

export const programPath = (program: string) => `/${program}`

export const coursePath = (program: string, course: string) => `/${program}/${course}`

export const weekPath = (program: string, course: string, week: number) =>
  `${coursePath(program, course)}/week-${week}`

/** Latest term lives at the base path; older terms at /<term>. */
export const assignmentPath = (
  program: string,
  course: string,
  week: number,
  kind: AssignmentKind,
  term?: string | null,
) => `${weekPath(program, course, week)}/${ASSIGNMENT_SEGMENT[kind]}${term ? `/${term}` : ''}`

export const weekNotesPath = (program: string, course: string, week: number) =>
  `${weekPath(program, course, week)}/notes`

export const notePath = (program: string, course: string, slug: string) =>
  `${coursePath(program, course)}/notes/${slug}`

export const formulaSheetPath = (program: string, course: string) =>
  `${coursePath(program, course)}/formula-sheet`

export const examPrepPath = (program: string, course: string) =>
  `${coursePath(program, course)}/qualifier-exam-prep`

export const pagePath = (path: string) => `/${path.replace(/^\/+/, '')}`

export const BLOG_PATH = '/blog'

export const blogPostPath = (slug: string) => `${BLOG_PATH}/${slug}`

export const blogCategoryPath = (slug: string) => `${BLOG_PATH}/category/${slug}`

export const NOTES_PATH = '/notes'

export const noteCoursePath = (slug: string) => `${NOTES_PATH}/${slug}`

export const PYQ_PATH = '/pyq'

export const PYQ_EXAMS = ['qualifier', 'quiz-1', 'quiz-2', 'end-term', 'oppe-1', 'oppe-2'] as const
export type PyqExam = (typeof PYQ_EXAMS)[number]

export const PYQ_EXAM_LABEL: Record<PyqExam, string> = {
  qualifier: 'Qualifier',
  'quiz-1': 'Quiz 1',
  'quiz-2': 'Quiz 2',
  'end-term': 'End Term',
  'oppe-1': 'OPPE 1',
  'oppe-2': 'OPPE 2',
}

export const isPyqExam = (value: string): value is PyqExam =>
  (PYQ_EXAMS as readonly string[]).includes(value)

export const pyqCoursePath = (slug: string) => `${PYQ_PATH}/${slug}`

export const pyqExamPath = (slug: string, exam: PyqExam) => `${pyqCoursePath(slug)}/${exam}`

/** Exams with a cross-course hub page, e.g. /pyq/quiz-2 (OPPE lives on the practice site). */
export const PYQ_HUB_EXAMS = ['qualifier', 'quiz-1', 'quiz-2', 'end-term'] as const
export type PyqHubExam = (typeof PYQ_HUB_EXAMS)[number]

export const pyqHubPath = (exam: PyqHubExam) => `${PYQ_PATH}/${exam}`

export const LECTURES_PATH = '/resources/lectures'

export const lectureCoursePath = (slug: string) => `${LECTURES_PATH}/${slug}`

export const lectureWeekPath = (slug: string, week: number) =>
  `${lectureCoursePath(slug)}/week-${week}`

/** Parses a "week-3" route segment. */
export function parseWeekSegment(segment: string): number | null {
  const match = WEEK_SEGMENT.exec(segment)
  return match ? Number(match[1]) : null
}

/** Terms sort chronologically: 2026-jan < 2026-may < 2026-sep. */
export function termSortKey(term: string): number {
  const [year, month] = term.split('-')
  const order = { jan: 1, may: 2, sep: 3 } as Record<string, number>
  return Number(year) * 10 + (order[month ?? ''] ?? 0)
}

const TERM_MONTH: Record<string, string> = { jan: 'January', may: 'May', sep: 'September' }

/** "2026-sep" → "September 2026". */
export function formatTerm(term: string): string {
  const [year, month] = term.split('-')
  return `${TERM_MONTH[month ?? ''] ?? month} ${year}`
}

/** Absolute URL for a site path, used for canonicals, sitemaps and OG. */
export function absoluteUrl(siteUrl: string, path: string): string {
  return new URL(path, `${siteUrl}/`).toString().replace(/\/$/, '') || siteUrl
}
