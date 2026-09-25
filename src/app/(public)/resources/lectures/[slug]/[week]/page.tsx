import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { PageContext } from '@/components/analytics/page-context'
import { PrevNext } from '@/components/content/prev-next'
import { PageHeader } from '@/components/layout/page-header'
import { LecturePlayer } from '@/components/lectures/lecture-player'
import { JsonLd } from '@/components/seo/json-ld'
import { Badge } from '@/components/ui/badge'
import { TabNav } from '@/components/ui/tab-nav'
import { getCourseLectures, getLectureCourses, type LectureCourse } from '@/lib/data/lectures'
import { redirectOrNotFound } from '@/lib/data/redirects'
import { getSeoOverrides } from '@/lib/data/seo-overrides'
import { getSiteSettings } from '@/lib/data/settings'
import { formatDuration } from '@/lib/lectures/videos'
import { LECTURES_PATH, lectureWeekPath, parseWeekSegment } from '@/lib/routes'
import { lectureVideosJsonLd } from '@/lib/seo/jsonld'
import { buildMetadata, NOT_FOUND_METADATA } from '@/lib/seo/metadata'
import { PLACEHOLDER_SEGMENT, withPlaceholder } from '@/lib/static-params'
import { pickTitle } from '@/lib/seo/title'

export async function generateStaticParams() {
  const courses = await getLectureCourses()
  return withPlaceholder(
    courses.flatMap((course) =>
      course.weeks.map(({ week }) => ({ slug: course.slug, week: `week-${week}` })),
    ),
    { slug: PLACEHOLDER_SEGMENT, week: PLACEHOLDER_SEGMENT },
  )
}

/** "IIT Madras MLT Week 3 Lectures: Machine Learning Techniques". */
function pageTitle(course: LectureCourse, week: number): string {
  return course.shortName.toLowerCase() === course.name.toLowerCase()
    ? `IIT Madras ${course.name} Week ${week} Lectures`
    : `IIT Madras ${course.shortName} Week ${week} Lectures: ${course.name}`
}

async function resolve(slug: string, segment: string) {
  const week = parseWeekSegment(segment)
  const courses = await getLectureCourses()
  const course = courses.find((c) => c.slug === slug)
  if (!course || week === null || !course.weeks.some((w) => w.week === week)) return null
  const lectures = (await getCourseLectures(course.id, true)).filter((l) => l.week === week)
  return { course, week, lectures }
}

export async function generateMetadata({
  params,
}: PageProps<'/resources/lectures/[slug]/[week]'>): Promise<Metadata> {
  const { slug, week } = await params
  const [found, settings, overrides] = await Promise.all([
    resolve(slug, week),
    getSiteSettings(),
    getSeoOverrides(),
  ])
  if (!found) return NOT_FOUND_METADATA
  const { course, lectures } = found
  const path = lectureWeekPath(course.slug, found.week)
  const short = course.shortName.toLowerCase()
  const topics = lectures
    .slice(0, 3)
    .map((l) => l.title)
    .join(', ')
  return buildMetadata({
    settings,
    path,
    template: 'lecture_week',
    vars: { course: course.name, short: course.shortName, code: course.code, week: found.week },
    fallbackTitle: pickTitle([
      `IITM BS ${course.shortName} Week ${found.week} Lectures (IIT Madras)`,
      `IITM BS ${course.shortName} Week ${found.week} Lectures`,
    ]),
    fallbackDescription: `Watch the ${lectures.length} official IIT Madras ${course.shortName} week ${found.week} lectures free: ${topics}.`,
    keywords: [
      `${short} week ${found.week} lectures`,
      `${short} week ${found.week}`,
      `iit madras ${short} week ${found.week}`,
      `${course.name.toLowerCase()} week ${found.week} lecture`,
    ],
    override: overrides[path],
  })
}

export default async function LectureWeekPage({
  params,
}: PageProps<'/resources/lectures/[slug]/[week]'>) {
  const { slug, week: segment } = await params
  const found = await resolve(slug, segment)
  if (!found) {
    if (parseWeekSegment(segment) === null) notFound()
    return redirectOrNotFound(`${LECTURES_PATH}/${slug}/${segment}`)
  }
  const { course, week, lectures } = found
  const path = lectureWeekPath(course.slug, week)
  const title = pageTitle(course, week)
  const position = course.weeks.findIndex((w) => w.week === week)
  const previous = course.weeks[position - 1]
  const next = course.weeks[position + 1]

  return (
    <>
      <PageContext type="lecture_week" entityId={course.id} />
      <PageHeader
        crumbs={[
          { name: 'Resources', path: '/resources' },
          { name: 'IIT Madras lectures', path: LECTURES_PATH },
          { name: course.shortName, path: course.path },
          { name: `Week ${week}`, path },
        ]}
        title={title}
        meta={
          <>
            <Badge tone="accent">{course.code}</Badge>
            <Badge>
              {lectures.length} {lectures.length === 1 ? 'lecture' : 'lectures'}
            </Badge>
          </>
        }
      />
      <div className="container-page space-y-10 py-8 sm:py-10">
        <TabNav
          label={`${course.shortName} weeks`}
          items={course.weeks.map((w) => ({
            href: lectureWeekPath(course.slug, w.week),
            label: `Week ${w.week}`,
            current: w.week === week,
          }))}
        />
        <LecturePlayer
          lectures={lectures.map((l) => ({
            youtubeId: l.youtubeId,
            title: l.title,
            lecture: l.lecture,
            duration: formatDuration(l.durationSeconds),
          }))}
        />
        <PrevNext
          previous={
            previous
              ? {
                  href: lectureWeekPath(course.slug, previous.week),
                  label: 'Previous week',
                  title: `Week ${previous.week} lectures`,
                }
              : null
          }
          next={
            next
              ? {
                  href: lectureWeekPath(course.slug, next.week),
                  label: 'Next week',
                  title: `Week ${next.week} lectures`,
                }
              : null
          }
        />
      </div>
      <JsonLd
        data={lectureVideosJsonLd({
          name: title,
          path,
          course: { name: course.name, code: course.code },
          videos: lectures.map((l) => ({
            youtubeId: l.youtubeId,
            name: l.title,
            uploadedAt: l.uploadedAt,
            durationSeconds: l.durationSeconds,
            lecture: l.lecture,
          })),
        })}
      />
    </>
  )
}
