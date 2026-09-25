import type { Metadata } from 'next'
import Link from 'next/link'

import { PageContext } from '@/components/analytics/page-context'
import { FaqAccordion } from '@/components/content/faq-accordion'
import { PageHeader } from '@/components/layout/page-header'
import { PaperList } from '@/components/pyq/paper-list'
import { JsonLd } from '@/components/seo/json-ld'
import { Badge } from '@/components/ui/badge'
import { TabNav } from '@/components/ui/tab-nav'
import { getBlogPostIndex } from '@/lib/data/blog'
import { getCourseHubPaths } from '@/lib/data/course-hubs'
import { getLectureCourses } from '@/lib/data/lectures'
import { getPage } from '@/lib/data/pages'
import { getCoursePapers, getPyqCourses, type PyqCourse } from '@/lib/data/question-papers'
import { redirectOrNotFound } from '@/lib/data/redirects'
import { getSeoOverrides } from '@/lib/data/seo-overrides'
import { getSiteSettings } from '@/lib/data/settings'
import { getNoteCourses } from '@/lib/data/student-notes'
import { paperHeading, papersByExam, pyqFaqs, pyqKeywords, termSpan } from '@/lib/pyq/papers'
import { PYQ_EXAM_LABEL, PYQ_PATH, pyqCoursePath, pyqExamPath } from '@/lib/routes'
import { notesCollectionJsonLd } from '@/lib/seo/jsonld'
import { buildMetadata } from '@/lib/seo/metadata'
import { PLACEHOLDER_SEGMENT, withPlaceholder } from '@/lib/static-params'
import { pickTitle, SEARCH_NAMES, yearRange } from '@/lib/seo/title'

export async function generateStaticParams() {
  const courses = await getPyqCourses()
  return withPlaceholder(
    courses.map((course) => ({ slug: course.slug })),
    { slug: PLACEHOLDER_SEGMENT },
  )
}

/** "IITM BS MLT PYQs: Machine Learning Techniques" (or just the name when it is already short). */
function pageTitle(course: PyqCourse): string {
  return course.shortName.toLowerCase() === course.name.toLowerCase()
    ? `IITM BS ${course.name} PYQs`
    : `IITM BS ${course.shortName} PYQs: ${course.name}`
}

function description(course: PyqCourse): string {
  const exams = course.exams.map((exam) => PYQ_EXAM_LABEL[exam])
  const list = exams.length > 1 ? `${exams.slice(0, -1).join(', ')} and ${exams.at(-1)}` : exams[0]
  return `${course.paperCount} ${course.name} (${course.shortName}, ${course.code}) previous year question papers from ${termSpan(course.terms)}: ${list}, with answers marked.`
}

export async function generateMetadata({ params }: PageProps<'/pyq/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const [courses, settings, overrides] = await Promise.all([
    getPyqCourses(),
    getSiteSettings(),
    getSeoOverrides(),
  ])
  const course = courses.find((c) => c.slug === slug)
  if (!course) return { robots: { index: false } }
  const years = yearRange(course.terms) ?? ''
  return buildMetadata({
    settings,
    path: course.path,
    template: 'pyq_course',
    vars: {
      course: course.name,
      short: course.shortName,
      code: course.code,
      count: course.paperCount,
      level: course.level,
    },
    fallbackTitle: pickTitle([
      SEARCH_NAMES[course.code] &&
        `IITM BS ${course.shortName} PYQ: ${SEARCH_NAMES[course.code]} Question Papers ${years}`,
      `IITM BS ${course.shortName} PYQ: Previous Year Question Papers ${years}`,
      `IITM BS ${course.shortName} PYQ: Previous Year Question Papers`,
      `IITM BS ${course.shortName} PYQ: Question Papers ${years}`,
      `IITM BS ${course.shortName} PYQ`,
    ]),
    fallbackDescription: description(course),
    keywords: pyqKeywords(course, course.exams),
    override: overrides[course.path],
  })
}

export default async function PyqCoursePage({ params }: PageProps<'/pyq/[slug]'>) {
  const { slug } = await params
  const [courses, pyqPage] = await Promise.all([getPyqCourses(), getPage('pyq')])
  const course = courses.find((c) => c.slug === slug)
  if (!course) return redirectOrNotFound(pyqCoursePath(slug))

  const [papers, notes, posts, hubs, lectureCourses] = await Promise.all([
    getCoursePapers(course.id),
    getNoteCourses(),
    getBlogPostIndex(),
    getCourseHubPaths(),
    getLectureCourses(),
  ])
  const lectures = lectureCourses.find((l) => l.id === course.id)
  const groups = papersByExam(papers)
  const notesPage = notes.find((note) => note.id === course.id)
  const guide = course.blogPostId ? posts.find((post) => post.id === course.blogPostId) : undefined
  const hub = course.courseId ? hubs.get(course.courseId) : undefined
  const indexName = pyqPage?.title.split(':')[0] ?? 'PYQs'
  const title = pageTitle(course)
  const allAnswered = papers.length > 0 && papers.every((paper) => paper.hasAnswers)

  return (
    <>
      <PageContext type="pyq_course" entityId={course.id} />
      <PageHeader
        crumbs={[
          { name: indexName, path: PYQ_PATH },
          { name: course.shortName, path: course.path },
        ]}
        title={title}
        meta={
          <>
            <Badge tone="accent">{course.code}</Badge>
            <Badge>
              {course.paperCount} {course.paperCount === 1 ? 'paper' : 'papers'}
            </Badge>
            <Badge>{termSpan(course.terms)}</Badge>
            {allAnswered ? <Badge>Answers marked</Badge> : null}
          </>
        }
      />
      <div className="container-page py-8 sm:py-10">
        <div className="container-reading space-y-8">
          <TabNav
            label={`${course.shortName} papers by exam`}
            items={[
              { href: course.path, label: `All (${course.paperCount})`, current: true },
              ...groups.map((group) => ({
                href: pyqExamPath(course.slug, group.exam),
                label: `${PYQ_EXAM_LABEL[group.exam]} (${group.papers.length})`,
              })),
            ]}
          />

          {groups.map((group) => {
            const heading = `${course.shortName} ${PYQ_EXAM_LABEL[group.exam]} previous year papers`
            return (
              <section
                key={group.exam}
                id={group.exam}
                aria-labelledby={`${group.exam}-heading`}
                className="scroll-mt-24"
              >
                <h2 id={`${group.exam}-heading`} className="mb-3 text-h3 font-semibold">
                  {heading}
                </h2>
                <PaperList papers={group.papers} label={heading} showExam={false} />
              </section>
            )
          })}

          {notesPage || hub || guide || lectures ? (
            <p className="flex flex-wrap gap-x-5 gap-y-2 text-small">
              {lectures ? (
                <Link href={lectures.path} className="text-accent-ink underline underline-offset-2">
                  IIT Madras {course.shortName} lectures
                </Link>
              ) : null}
              {notesPage ? (
                <Link
                  href={notesPage.path}
                  className="text-accent-ink underline underline-offset-2"
                >
                  {course.shortName} notes
                </Link>
              ) : null}
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

          <FaqAccordion faqs={pyqFaqs(course, papers)} title="Common questions" />
        </div>
      </div>
      <JsonLd
        data={notesCollectionJsonLd({
          name: title,
          description: description(course),
          path: course.path,
          course: { name: course.name, code: course.code },
          items: papers.map((paper) => ({
            name: `${course.shortName} ${paperHeading(paper)}`,
            url: paper.url,
          })),
        })}
      />
    </>
  )
}
