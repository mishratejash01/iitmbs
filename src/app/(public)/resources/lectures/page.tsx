import type { Metadata } from 'next'

import { PageContext } from '@/components/analytics/page-context'
import { PageHeader } from '@/components/layout/page-header'
import { CourseFilter } from '@/components/pyq/course-filter'
import { JsonLd } from '@/components/seo/json-ld'
import { getLectureCourses, type LectureCourse } from '@/lib/data/lectures'
import { getPrograms } from '@/lib/data/programs'
import { getSeoOverrides } from '@/lib/data/seo-overrides'
import { getSiteSettings } from '@/lib/data/settings'
import { NOTE_LEVELS } from '@/lib/data/student-notes'
import { LECTURES_PATH } from '@/lib/routes'
import { notesCollectionJsonLd } from '@/lib/seo/jsonld'
import { buildMetadata } from '@/lib/seo/metadata'

const TITLE = 'IIT Madras Lectures for Every IITM BS Course'

export async function generateMetadata(): Promise<Metadata> {
  const [settings, overrides, courses] = await Promise.all([
    getSiteSettings(),
    getSeoOverrides(),
    getLectureCourses(),
  ])
  const videos = courses.reduce((sum, course) => sum + course.videoCount, 0)
  return buildMetadata({
    settings,
    path: LECTURES_PATH,
    fallbackTitle: 'IITM BS Lectures: IIT Madras BS Degree Lectures by Week',
    fallbackDescription: `${videos} official IIT Madras BS lecture videos for ${courses.length} courses, sorted by week, with a player on every page.`,
    keywords: [
      'iit madras lectures',
      'iitm bs lectures',
      'iitm bs lecture videos',
      'iit madras bs degree youtube lectures',
      'iitm bs week wise lectures',
    ],
    override: overrides[LECTURES_PATH],
  })
}

const courseLink = (course: LectureCourse) => ({
  path: course.path,
  title:
    course.shortName.toLowerCase() === course.name.toLowerCase()
      ? `${course.name} lectures (${course.videoCount})`
      : `${course.shortName} lectures: ${course.name} (${course.videoCount})`,
  search: `${course.shortName} ${course.name} ${course.code}`.toLowerCase(),
})

/** Every course with IIT Madras lecture videos, by programme and level. */
export default async function LecturesIndexPage() {
  const [courses, programs] = await Promise.all([getLectureCourses(), getPrograms()])
  const known = new Set(programs.map((program) => program.slug))
  const sections = [
    ...programs.map((program) => ({
      key: program.slug,
      heading: (label: string) => `${program.shortName} ${label.toLowerCase()} level`,
      courses: courses.filter((course) => course.program === program.slug),
    })),
    {
      key: 'other',
      heading: (label: string) => `${label} level`,
      courses: courses.filter((course) => !known.has(course.program)),
    },
  ]
  const groups = sections
    .flatMap((section) =>
      NOTE_LEVELS.map(({ level, label }) => ({
        id: `${section.key}-${level}-lectures`,
        heading: section.heading(label),
        items: section.courses.filter((course) => course.level === level).map(courseLink),
      })),
    )
    .filter((group) => group.items.length > 0)

  return (
    <>
      <PageContext type="lectures" />
      <PageHeader
        crumbs={[
          { name: 'Resources', path: '/resources' },
          { name: 'IIT Madras lectures', path: LECTURES_PATH },
        ]}
        title={TITLE}
      />
      <div className="container-page space-y-10 py-8 sm:py-10">
        <CourseFilter groups={groups} />
      </div>
      <JsonLd
        data={notesCollectionJsonLd({
          name: TITLE,
          description: TITLE,
          path: LECTURES_PATH,
          items: courses.map((course) => ({ name: `${course.name} (${course.code}) lectures` })),
        })}
      />
    </>
  )
}
