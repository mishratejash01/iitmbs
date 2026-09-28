import type { LectureCourse } from '@/lib/data/lectures'
import type { ProgramPageData } from '@/lib/data/programs'
import type { NoteCourse, NoteLevel } from '@/lib/data/student-notes'

export type LevelId = 'qualifier' | NoteLevel

export type LevelSummary = {
  id: LevelId
  label: string
  /** One entry per course name, sorted; each opens the course's best page. */
  courses: Array<{ name: string; href: string }>
  noteCount: number
  videoCount: number
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
 * course hubs), then foundation, diploma and degree (every course with notes
 * or lectures). A course opens its notes when it has some, otherwise its
 * lectures. Levels with no courses are left out.
 */
export function buildLevels({
  programPages,
  noteCourses,
  lectureCourses,
}: {
  programPages: Array<Pick<ProgramPageData, 'courses'>>
  noteCourses: Array<Pick<NoteCourse, 'shortName' | 'path' | 'level' | 'noteCount'>>
  lectureCourses: Array<Pick<LectureCourse, 'shortName' | 'path' | 'level' | 'videoCount'>>
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
    videoCount: 0,
  }

  const levels = DEGREE_LEVELS.map(({ id, label }): LevelSummary => {
    const notes = noteCourses.filter((course) => course.level === id)
    const lectures = lectureCourses.filter((course) => course.level === id)
    const courses = new Map<string, { name: string; href: string }>()
    for (const course of [...notes, ...lectures]) {
      if (!courses.has(course.shortName)) {
        courses.set(course.shortName, { name: course.shortName, href: course.path })
      }
    }
    return {
      id,
      label,
      courses: [...courses.values()].sort(byName),
      noteCount: notes.reduce((sum, course) => sum + course.noteCount, 0),
      videoCount: lectures.reduce((sum, course) => sum + course.videoCount, 0),
    }
  })

  return [qualifier, ...levels].filter((level) => level.courses.length > 0)
}
