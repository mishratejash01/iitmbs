import Link from 'next/link'

import { getCourseCore } from '@/lib/data/courses'
import { getProgramPage } from '@/lib/data/programs'

/** The week-by-week syllabus of a programme's qualifier courses, from the DB. */
export async function SyllabusOverview({ program }: { program?: string }) {
  if (!program) return null
  const page = await getProgramPage(program)
  if (!page) return null

  const courses = await Promise.all(
    page.courses
      .filter((course) => course.homeProgram === null)
      .map(async (course) => ({ course, core: await getCourseCore(program, course.slug) })),
  )

  return (
    <div className="space-y-8">
      {courses.map(({ course, core }) =>
        core ? (
          <section key={course.id} aria-labelledby={`syllabus-${course.slug}`}>
            <h3 id={`syllabus-${course.slug}`} className="!mt-0 text-h3 font-semibold text-text">
              <Link href={course.path}>
                {course.name}
                {course.code ? (
                  <span className="ml-2 text-small font-normal text-muted">{course.code}</span>
                ) : null}
              </Link>
            </h3>
            <ol className="mt-3 !list-none border-t border-border !pl-0">
              {core.weeks.map((week) => (
                <li key={week.id} className="!mt-0 border-b border-border py-4">
                  <Link href={week.path} className="font-medium">
                    Week {week.number}: {week.title}
                  </Link>
                  {week.topics.length > 0 ? (
                    <p className="mt-1 text-small text-muted">{week.topics.join(' · ')}</p>
                  ) : null}
                </li>
              ))}
            </ol>
          </section>
        ) : null,
      )}
    </div>
  )
}
