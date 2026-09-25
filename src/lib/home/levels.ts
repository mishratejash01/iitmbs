import type { ProgramPageData } from '@/lib/data/programs'
import type { PyqCourse } from '@/lib/data/question-papers'
import type { NoteCourse, NoteLevel } from '@/lib/data/student-notes'

export type LevelId = 'qualifier' | NoteLevel

export type LevelSummary = {
  id: LevelId
  label: string
  /** One entry per course name, sorted; each opens the course's best page. */
  courses: Array<{ name: string; href: string }>
  noteCount: number
  paperCount: number
}

const DEGREE_LEVELS: Array<{ id: NoteLevel; label: string }> = [
  { id: 'foundation', label: 'Foundation' },
  { id: 'diploma', label: 'Diploma' },
  { id: 'degree', label: 'Degree' },
]

const byName = (a: { name: string }, b: { name: string }) =>
  a.name.localeCompare(b.name, 'en', { numeric: true })

/**
 * The degree as levels for the homepage: the qualifier (its week-by-week
 * course hubs and past qualifier papers), then foundation, diploma and degree
 * (every course with notes or papers). A course opens its notes when it has
 * some, otherwise its papers. Levels with no courses are left out.
 */
export function buildLevels({
  programPages,
  noteCourses,
  pyqCourses,
}: {
  programPages: Array<Pick<ProgramPageData, 'courses'>>
  noteCourses: Array<
    Pick<NoteCourse, 'code' | 'slug' | 'shortName' | 'path' | 'level' | 'noteCount'>
  >
  pyqCourses: Array<
    Pick<PyqCourse, 'code' | 'slug' | 'shortName' | 'path' | 'level' | 'paperCount' | 'examCounts'>
  >
}): LevelSummary[] {
  const qualifierCourses = new Map<string, { name: string; href: string }>()
  for (const course of programPages.flatMap((page) => page.courses)) {
    if (!qualifierCourses.has(course.shortName)) {
      qualifierCourses.set(course.shortName, { name: course.shortName, href: course.path })
    }
  }

  const qualifier: LevelSummary = {
    id: 'qualifier',
    label: 'Qualifier',
    courses: [...qualifierCourses.values()],
    noteCount: 0,
    paperCount: pyqCourses.reduce((sum, course) => sum + (course.examCounts.qualifier ?? 0), 0),
  }

  const levels = DEGREE_LEVELS.map(({ id, label }): LevelSummary => {
    const notes = noteCourses.filter((course) => course.level === id)
    const papers = pyqCourses.filter((course) => course.level === id)
    const courses = new Map<string, { name: string; href: string }>()
    for (const course of [...notes, ...papers]) {
      if (!courses.has(course.shortName)) {
        courses.set(course.shortName, { name: course.shortName, href: course.path })
      }
    }
    return {
      id,
      label,
      courses: [...courses.values()].sort(byName),
      noteCount: notes.reduce((sum, course) => sum + course.noteCount, 0),
      paperCount: papers.reduce((sum, course) => sum + course.paperCount, 0),
    }
  })

  return [qualifier, ...levels].filter((level) => level.courses.length > 0)
}
