import type { Metadata } from 'next'
import Link from 'next/link'

import { PageContext } from '@/components/analytics/page-context'
import { PageHeader } from '@/components/layout/page-header'
import { LecturePlayer } from '@/components/lectures/lecture-player'
import { JsonLd } from '@/components/seo/json-ld'
import { Badge } from '@/components/ui/badge'
import { SectionHeading } from '@/components/ui/section-heading'
import { getBlogPostIndex } from '@/lib/data/blog'
import { getCourseHubPaths } from '@/lib/data/course-hubs'
import { getCourseLectures, getLectureCourses, type LectureCourse } from '@/lib/data/lectures'
import { getPyqCourses } from '@/lib/data/question-papers'
import { redirectOrNotFound } from '@/lib/data/redirects'
import { getSeoOverrides } from '@/lib/data/seo-overrides'
import { getSiteSettings } from '@/lib/data/settings'
import { getNoteCourses } from '@/lib/data/student-notes'
import { formatDuration } from '@/lib/lectures/videos'
import { LECTURES_PATH, lectureCoursePath, lectureWeekPath } from '@/lib/routes'
import { lectureVideosJsonLd } from '@/lib/seo/jsonld'
import { buildMetadata, NOT_FOUND_METADATA } from '@/lib/seo/metadata'
import { PLACEHOLDER_SEGMENT, withPlaceholder } from '@/lib/static-params'
import { pickTitle, withDigits } from '@/lib/seo/title'

export async function generateStaticParams() {
  const courses = await getLectureCourses()
  return withPlaceholder(
    courses.map((course) => ({ slug: course.slug })),
    { slug: PLACEHOLDER_SEGMENT },
  )
}

/** "IIT Madras MLT Lectures: Machine Learning Techniques". */
function lectureCourseTitle(course: LectureCourse): string {
  return course.shortName.toLowerCase() === course.name.toLowerCase()
    ? `IIT Madras ${course.name} Lectures`
    : `IIT Madras ${course.shortName} Lectures: ${course.name}`
}

export async function generateMetadata({
  params,
}: PageProps<'/resources/lectures/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const [courses, settings, overrides] = await Promise.all([
    getLectureCourses(),
    getSiteSettings(),
    getSeoOverrides(),
  ])
  const course = courses.find((c) => c.slug === slug)
  if (!course) return NOT_FOUND_METADATA
  const short = course.shortName.toLowerCase()
  const weekly = course.weeks.length > 0
  const name = withDigits(course.name)
  const same = course.shortName.toLowerCase() === name.toLowerCase()
  return buildMetadata({
    settings,
    path: course.path,
    template: 'lecture_course',
    vars: { course: course.name, short: course.shortName, code: course.code },
    fallbackTitle: pickTitle([
      same
        ? `IITM BS ${name} Lectures (IIT Madras)`
        : `IITM BS ${course.shortName} Lectures: ${name} (IIT Madras)`,
      !same && `IITM BS ${course.shortName} Lectures: ${name}`,
      weekly && `IITM BS ${course.shortName} Lectures by Week (IIT Madras)`,
      `IITM BS ${course.shortName} Lectures (IIT Madras)`,
      `IITM BS ${course.shortName} Lectures`,
    ]),
    fallbackDescription: `Watch all ${course.videoCount} official IIT Madras ${course.shortName} lectures for ${name} free, ${weekly ? `week by week (${course.weeks.length} weeks)` : 'in teaching order'}, with a player on every page.`,
    keywords: [
      `${short} lectures`,
      `${short} lecture videos`,
      `iit madras ${short} lectures`,
      `iitm bs ${short} lectures`,
      `${course.name.toLowerCase()} lectures`,
      `${course.code.toLowerCase()} lectures`,
      `${short} week wise lectures`,
    ],
    override: overrides[course.path],
  })
}

export default async function LectureCoursePage({
  params,
}: PageProps<'/resources/lectures/[slug]'>) {
  const { slug } = await params
  const courses = await getLectureCourses()
  const course = courses.find((c) => c.slug === slug)
  if (!course) return redirectOrNotFound(lectureCoursePath(slug))

  const [lectures, notes, pyqs, hubs, posts] = await Promise.all([
    getCourseLectures(course.id, course.weeks.length > 0),
    getNoteCourses(),
    getPyqCourses(),
    getCourseHubPaths(),
    getBlogPostIndex(),
  ])
  const guide = course.blogPostId ? posts.find((post) => post.id === course.blogPostId) : undefined
  const extras = lectures.filter((l) => l.week === null || l.week < 1)
  const notesPage = notes.find((n) => n.id === course.id)
  const papers = pyqs.find((p) => p.id === course.id)
  const hub = course.courseId ? hubs.get(course.courseId) : undefined
  const title = lectureCourseTitle(course)
  // Videos outside the week pages: the whole course when it has none.
  const extrasTitle = course.weeks.length > 0 ? 'More lectures' : 'All lectures'

  return (
    <>
      <PageContext type="lecture_course" entityId={course.id} />
      <PageHeader
        crumbs={[
          { name: 'Resources', path: '/resources' },
          { name: 'IIT Madras lectures', path: LECTURES_PATH },
          { name: course.shortName, path: course.path },
        ]}
        title={title}
        meta={
          <>
            <Badge tone="accent">{course.code}</Badge>
            <Badge>
              {course.videoCount} {course.videoCount === 1 ? 'lecture' : 'lectures'}
            </Badge>
            {course.weeks.length > 0 ? (
              <Badge>
                {course.weeks.length} {course.weeks.length === 1 ? 'week' : 'weeks'}
              </Badge>
            ) : null}
          </>
        }
      />
      <div className="container-page space-y-14 py-8 sm:py-10">
        {course.weeks.length > 0 ? (
          <section aria-labelledby="weeks">
            <SectionHeading id="weeks" title="Weeks" />
            <ol className="border-t border-border">
              {course.weeks.map(({ week, count }) => {
                const inWeek = lectures.filter((l) => l.week === week)
                return (
                  <li key={week} className="border-b border-border">
                    <Link
                      href={lectureWeekPath(course.slug, week)}
                      className="group grid gap-x-8 gap-y-1 py-5 sm:grid-cols-[6.5rem_1fr]"
                    >
                      <span className="text-small font-semibold text-accent-ink">Week {week}</span>
                      <span className="min-w-0">
                        <span className="block text-h3 font-semibold text-text decoration-accent-ink/40 underline-offset-4 group-hover:text-accent-ink group-hover:underline">
                          {count} {count === 1 ? 'lecture' : 'lectures'}
                        </span>
                        <span className="mt-1 line-clamp-2 block text-small text-muted">
                          {inWeek.map((l) => l.title).join(' · ')}
                        </span>
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ol>
          </section>
        ) : null}

        {extras.length > 0 ? (
          <section aria-labelledby="lectures">
            <SectionHeading id="lectures" title={extrasTitle} />
            <LecturePlayer
              listLabel={extrasTitle}
              lectures={extras.map((l) => ({
                youtubeId: l.youtubeId,
                title: l.title,
                lecture: l.lecture,
                duration: formatDuration(l.durationSeconds),
              }))}
            />
          </section>
        ) : null}

        {guide || notesPage || papers || hub ? (
          <p className="flex flex-wrap gap-x-6 gap-y-2 text-small">
            {guide ? (
              <Link
                href={guide.path}
                className="font-semibold text-accent-ink underline decoration-accent-ink/30 underline-offset-4 hover:decoration-accent-ink"
              >
                {course.shortName} course guide
              </Link>
            ) : null}
            {notesPage ? (
              <Link
                href={notesPage.path}
                className="font-semibold text-accent-ink underline decoration-accent-ink/30 underline-offset-4 hover:decoration-accent-ink"
              >
                {course.shortName} notes
              </Link>
            ) : null}
            {papers ? (
              <Link
                href={papers.path}
                className="font-semibold text-accent-ink underline decoration-accent-ink/30 underline-offset-4 hover:decoration-accent-ink"
              >
                {course.shortName} previous year papers
              </Link>
            ) : null}
            {hub ? (
              <Link
                href={hub}
                className="font-semibold text-accent-ink underline decoration-accent-ink/30 underline-offset-4 hover:decoration-accent-ink"
              >
                Week-by-week help for {course.shortName}
              </Link>
            ) : null}
          </p>
        ) : null}
      </div>
      {extras.length > 0 ? (
        <JsonLd
          data={lectureVideosJsonLd({
            name: title,
            path: course.path,
            course: { name: course.name, code: course.code },
            videos: extras.map((l) => ({
              youtubeId: l.youtubeId,
              name: l.title,
              uploadedAt: l.uploadedAt,
              durationSeconds: l.durationSeconds,
              lecture: l.lecture,
            })),
          })}
        />
      ) : null}
    </>
  )
}
