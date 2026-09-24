import type { Metadata } from 'next'

import { PageContext } from '@/components/analytics/page-context'
import { PageHeader } from '@/components/layout/page-header'
import { CourseFilter } from '@/components/pyq/course-filter'
import { JsonLd } from '@/components/seo/json-ld'
import { getLectureCourses } from '@/lib/data/lectures'
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
    fallbackTitle: `${TITLE}, Week by Week | ${settings.site_name}`,
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

/** Every course with IIT Madras lecture videos, by level. */
export default async function LecturesIndexPage() {
  const courses = await getLectureCourses()
  const groups = NOTE_LEVELS.map(({ level, label }) => ({
    id: `${level}-lectures`,
    heading: `${label} level lectures`,
    items: courses
      .filter((course) => course.level === level)
      .map((course) => ({
        path: course.path,
        title:
          course.shortName.toLowerCase() === course.name.toLowerCase()
            ? `${course.name} lectures (${course.videoCount})`
            : `${course.shortName} lectures: ${course.name} (${course.videoCount})`,
        search: `${course.shortName} ${course.name} ${course.code}`.toLowerCase(),
      })),
  })).filter((group) => group.items.length > 0)

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
