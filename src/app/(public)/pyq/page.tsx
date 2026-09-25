import type { Metadata } from 'next'
import Link from 'next/link'

import { PageContext } from '@/components/analytics/page-context'
import { cmsMetadata } from '@/components/content/cms-route'
import { PageHeader } from '@/components/layout/page-header'
import { CourseFilter } from '@/components/pyq/course-filter'
import { JsonLd } from '@/components/seo/json-ld'
import { getPage } from '@/lib/data/pages'
import { getPyqCourses } from '@/lib/data/question-papers'
import { redirectOrNotFound } from '@/lib/data/redirects'
import { NOTE_LEVELS } from '@/lib/data/student-notes'
import { PYQ_EXAM_LABEL, PYQ_HUB_EXAMS, PYQ_PATH, pyqHubPath } from '@/lib/routes'
import { notesCollectionJsonLd } from '@/lib/seo/jsonld'

export function generateMetadata(): Promise<Metadata> {
  return cmsMetadata('pyq')
}

/** Every course with question papers, by level. Title and SEO come from the CMS page "pyq". */
export default async function PyqIndexPage() {
  const [page, courses] = await Promise.all([getPage('pyq'), getPyqCourses()])
  if (!page) return redirectOrNotFound(PYQ_PATH)

  const groups = NOTE_LEVELS.map(({ level, label }) => ({
    id: `${level}-pyqs`,
    heading: `${label} level PYQs`,
    items: courses
      .filter((course) => course.level === level)
      .map((course) => ({
        path: course.path,
        title:
          course.shortName.toLowerCase() === course.name.toLowerCase()
            ? `${course.name} PYQs (${course.paperCount})`
            : `${course.shortName} PYQs: ${course.name} (${course.paperCount})`,
        search: `${course.shortName} ${course.name} ${course.code}`.toLowerCase(),
      })),
  })).filter((group) => group.items.length > 0)

  return (
    <>
      <PageContext type="pyq" entityId={page.id} />
      <PageHeader
        crumbs={[{ name: page.title.split(':')[0] ?? page.title, path: PYQ_PATH }]}
        title={page.title}
      />
      <div className="container-page space-y-10 py-8 sm:py-10">
        <nav aria-label="PYQs by exam" className="flex flex-wrap gap-x-6 gap-y-2 text-small">
          {PYQ_HUB_EXAMS.map((exam) => (
            <Link
              key={exam}
              href={pyqHubPath(exam)}
              className="font-semibold text-accent-ink underline decoration-accent-ink/30 underline-offset-4 hover:decoration-accent-ink"
            >
              {PYQ_EXAM_LABEL[exam]} PYQs, all courses
            </Link>
          ))}
        </nav>
        <CourseFilter groups={groups} />
      </div>
      <JsonLd
        data={notesCollectionJsonLd({
          name: page.title,
          description: page.summary ?? page.title,
          path: PYQ_PATH,
          items: courses.map((course) => ({
            name: `${course.name} (${course.code}) previous year question papers`,
          })),
        })}
      />
    </>
  )
}
