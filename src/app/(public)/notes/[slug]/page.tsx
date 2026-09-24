import type { Metadata } from 'next'
import Link from 'next/link'

import { PageContext } from '@/components/analytics/page-context'
import { ResourceList } from '@/components/content/resource-list'
import { PageHeader } from '@/components/layout/page-header'
import { JsonLd } from '@/components/seo/json-ld'
import { Badge } from '@/components/ui/badge'
import { getBlogPostIndex } from '@/lib/data/blog'
import { getPage } from '@/lib/data/pages'
import { getProgramPage, getPrograms } from '@/lib/data/programs'
import { redirectOrNotFound } from '@/lib/data/redirects'
import { getSeoOverrides } from '@/lib/data/seo-overrides'
import { getSiteSettings } from '@/lib/data/settings'
import { getCourseNotes, getNoteCourses, type NoteCourse } from '@/lib/data/student-notes'
import { groupNotes } from '@/lib/notes/group'
import { noteCoursePath, NOTES_PATH } from '@/lib/routes'
import { notesCollectionJsonLd } from '@/lib/seo/jsonld'
import { buildMetadata } from '@/lib/seo/metadata'
import { PLACEHOLDER_SEGMENT, withPlaceholder } from '@/lib/static-params'

export async function generateStaticParams() {
  const courses = await getNoteCourses()
  return withPlaceholder(
    courses.map((course) => ({ slug: course.slug })),
    { slug: PLACEHOLDER_SEGMENT },
  )
}

/** "IITM BS MLT Notes: Machine Learning Techniques" (or just the name when it is already short). */
function pageTitle(course: NoteCourse): string {
  return course.shortName.toLowerCase() === course.name.toLowerCase()
    ? `IITM BS ${course.name} Notes`
    : `IITM BS ${course.shortName} Notes: ${course.name}`
}

export async function generateMetadata({ params }: PageProps<'/notes/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const [courses, settings, overrides] = await Promise.all([
    getNoteCourses(),
    getSiteSettings(),
    getSeoOverrides(),
  ])
  const course = courses.find((c) => c.slug === slug)
  if (!course) return { robots: { index: false } }
  return buildMetadata({
    settings,
    path: course.path,
    template: 'note_course',
    vars: {
      course: course.name,
      short: course.shortName,
      code: course.code,
      count: course.noteCount,
      level: course.level,
    },
    fallbackTitle: `${pageTitle(course)} (${course.code}) | ${settings.site_name}`,
    fallbackDescription: `${course.noteCount} free ${course.name} (${course.shortName}, ${course.code}) notes shared by IITM BS students, week by week.`,
    seo: course.seo,
    override: overrides[course.path],
  })
}

/** "MLT week 3 notes" → "Week 3 notes" for the jump links. */
function sectionLabel(heading: string, shortName: string): string {
  const label = heading.replace(`${shortName} `, '')
  return label.charAt(0).toUpperCase() + label.slice(1)
}

/** Paths of the qualifier course hubs, by course id. */
async function courseHubPaths(): Promise<Map<string, string>> {
  const programs = await getPrograms()
  const pages = await Promise.all(programs.map((p) => getProgramPage(p.slug)))
  return new Map(pages.flatMap((page) => page?.courses.map((c) => [c.id, c.path] as const) ?? []))
}

export default async function NoteCoursePage({ params }: PageProps<'/notes/[slug]'>) {
  const { slug } = await params
  const [courses, notesPage] = await Promise.all([getNoteCourses(), getPage('notes')])
  const course = courses.find((c) => c.slug === slug)
  if (!course) return redirectOrNotFound(noteCoursePath(slug))

  const [notes, posts, hubs] = await Promise.all([
    getCourseNotes(course.id),
    getBlogPostIndex(),
    courseHubPaths(),
  ])
  const groups = groupNotes(notes, course.shortName)
  const guide = course.blogPostId ? posts.find((post) => post.id === course.blogPostId) : undefined
  const hub = course.courseId ? hubs.get(course.courseId) : undefined
  const notesName = notesPage?.title.split(':')[0] ?? 'Notes'
  const title = pageTitle(course)

  return (
    <>
      <PageContext type="note_course" entityId={course.id} />
      <PageHeader
        crumbs={[
          { name: notesName, path: NOTES_PATH },
          { name: course.shortName, path: course.path },
        ]}
        title={title}
        meta={
          <>
            <Badge tone="accent">{course.code}</Badge>
            <Badge>
              {course.noteCount} {course.noteCount === 1 ? 'note' : 'notes'}
            </Badge>
          </>
        }
      />
      <div className="container-page py-8 sm:py-10">
        <div className="container-reading space-y-8">
          {groups.length > 1 ? (
            <nav aria-label={`${course.shortName} notes sections`} data-print="hide">
              <ul className="flex flex-wrap gap-2">
                {groups.map((group) => (
                  <li key={group.id}>
                    <a
                      href={`#${group.id}`}
                      className="inline-flex min-h-10 items-center rounded-full border border-border bg-card px-3.5 text-small text-text hover:border-accent"
                    >
                      {sectionLabel(group.heading, course.shortName)}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}

          {groups.map((group) => (
            <section
              key={group.id}
              id={group.id}
              aria-labelledby={`${group.id}-heading`}
              className="scroll-mt-24"
            >
              <h2 id={`${group.id}-heading`} className="mb-3 text-h3 font-semibold">
                {group.heading}
              </h2>
              <ResourceList items={group.items} label={group.heading} />
            </section>
          ))}

          {guide || hub ? (
            <p className="flex flex-wrap gap-x-5 gap-y-2 text-small">
              {hub ? (
                <Link href={hub} className="text-accent-ink underline underline-offset-2">
                  Week-by-week help for {course.shortName}
                </Link>
              ) : null}
              {guide ? (
                <Link href={guide.path} className="text-accent-ink underline underline-offset-2">
                  {course.shortName} course guide
                </Link>
              ) : null}
            </p>
          ) : null}
        </div>
      </div>
      <JsonLd
        data={notesCollectionJsonLd({
          name: title,
          description: `${course.noteCount} ${course.name} (${course.code}) notes shared by IITM BS students.`,
          path: course.path,
          course: { name: course.name, code: course.code },
          items: notes.map((note) => ({
            name: `${course.shortName} ${note.title}`,
            author: note.contributor,
          })),
        })}
      />
    </>
  )
}
