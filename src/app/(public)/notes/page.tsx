import type { Metadata } from 'next'

import { PageContext } from '@/components/analytics/page-context'
import { cmsMetadata } from '@/components/content/cms-route'
import { LinkList } from '@/components/content/link-list'
import { PageHeader } from '@/components/layout/page-header'
import { JsonLd } from '@/components/seo/json-ld'
import { SectionHeading } from '@/components/ui/section-heading'
import { getPage } from '@/lib/data/pages'
import { redirectOrNotFound } from '@/lib/data/redirects'
import { getNoteCourses, NOTE_LEVELS } from '@/lib/data/student-notes'
import { NOTES_PATH } from '@/lib/routes'
import { notesCollectionJsonLd } from '@/lib/seo/jsonld'

export function generateMetadata(): Promise<Metadata> {
  return cmsMetadata('notes')
}

/** Every course with student notes, grouped by level. Title and SEO come from the CMS page "notes". */
export default async function NotesIndexPage() {
  const [page, courses] = await Promise.all([getPage('notes'), getNoteCourses()])
  if (!page) return redirectOrNotFound(NOTES_PATH)

  const levels = NOTE_LEVELS.map(({ level, label }) => ({
    level,
    label,
    courses: courses.filter((course) => course.level === level),
  })).filter((group) => group.courses.length > 0)

  return (
    <>
      <PageContext type="notes" entityId={page.id} />
      <PageHeader
        crumbs={[{ name: page.title.split(':')[0] ?? page.title, path: NOTES_PATH }]}
        title={page.title}
      />
      <div className="container-page space-y-10 py-8 sm:py-10">
        {levels.map((group) => (
          <section
            key={group.level}
            aria-labelledby={`${group.level}-notes`}
            className="container-reading"
          >
            <SectionHeading id={`${group.level}-notes`} title={`${group.label} level notes`} />
            <LinkList
              label={`${group.label} courses`}
              items={group.courses.map((course) => ({
                path: course.path,
                title:
                  course.shortName.toLowerCase() === course.name.toLowerCase()
                    ? `${course.name} notes (${course.noteCount})`
                    : `${course.shortName} notes: ${course.name} (${course.noteCount})`,
              }))}
            />
          </section>
        ))}
      </div>
      <JsonLd
        data={notesCollectionJsonLd({
          name: page.title,
          description: page.summary ?? page.title,
          path: NOTES_PATH,
          items: courses.map((course) => ({ name: `${course.name} (${course.code}) notes` })),
        })}
      />
    </>
  )
}
