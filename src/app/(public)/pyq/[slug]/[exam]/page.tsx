import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { PageContext } from '@/components/analytics/page-context'
import { FaqAccordion } from '@/components/content/faq-accordion'
import { PageHeader } from '@/components/layout/page-header'
import { PaperList } from '@/components/pyq/paper-list'
import { JsonLd } from '@/components/seo/json-ld'
import { Badge } from '@/components/ui/badge'
import { TabNav } from '@/components/ui/tab-nav'
import { getPage } from '@/lib/data/pages'
import { getCoursePapers, getPyqCourses, type PyqCourse } from '@/lib/data/question-papers'
import { redirectOrNotFound } from '@/lib/data/redirects'
import { getSeoOverrides } from '@/lib/data/seo-overrides'
import { getSiteSettings } from '@/lib/data/settings'
import { getNoteCourses } from '@/lib/data/student-notes'
import { paperHeading, paperSpan, pyqFaqs, pyqKeywords } from '@/lib/pyq/papers'
import {
  isPyqExam,
  PYQ_EXAM_LABEL,
  PYQ_HUB_EXAMS,
  PYQ_PATH,
  pyqCoursePath,
  pyqExamPath,
  pyqHubPath,
  type PyqHubExam,
  type PyqExam,
} from '@/lib/routes'
import { notesCollectionJsonLd } from '@/lib/seo/jsonld'
import { buildMetadata } from '@/lib/seo/metadata'
import { PLACEHOLDER_SEGMENT, withPlaceholder } from '@/lib/static-params'
import { pickTitle, SEARCH_NAMES, yearRange } from '@/lib/seo/title'

export async function generateStaticParams() {
  const courses = await getPyqCourses()
  return withPlaceholder(
    courses.flatMap((course) => course.exams.map((exam) => ({ slug: course.slug, exam }))),
    { slug: PLACEHOLDER_SEGMENT, exam: PLACEHOLDER_SEGMENT },
  )
}

/** "IITM BS MLT Quiz 1 PYQs: Machine Learning Techniques". */
function pageTitle(course: PyqCourse, exam: PyqExam): string {
  const label = PYQ_EXAM_LABEL[exam]
  return course.shortName.toLowerCase() === course.name.toLowerCase()
    ? `IITM BS ${course.name} ${label} PYQs`
    : `IITM BS ${course.shortName} ${label} PYQs: ${course.name}`
}

async function resolve(slug: string, exam: string) {
  const courses = await getPyqCourses()
  const course = courses.find((c) => c.slug === slug)
  if (!course || !isPyqExam(exam) || !course.exams.includes(exam)) return null
  const papers = (await getCoursePapers(course.id)).filter((paper) => paper.exam === exam)
  return { course, exam, papers }
}

function description(course: PyqCourse, exam: PyqExam, count: number, span: string | null) {
  return `${count} ${course.name} (${course.shortName}, ${course.code}) ${PYQ_EXAM_LABEL[exam]} previous year question papers from ${span}, with answers marked and the exact pages for ${course.shortName}.`
}

export async function generateMetadata({
  params,
}: PageProps<'/pyq/[slug]/[exam]'>): Promise<Metadata> {
  const { slug, exam } = await params
  const [found, settings, overrides] = await Promise.all([
    resolve(slug, exam),
    getSiteSettings(),
    getSeoOverrides(),
  ])
  if (!found) return { robots: { index: false } }
  const { course, papers } = found
  const path = pyqExamPath(course.slug, found.exam)
  const span = paperSpan(papers)
  const years = yearRange(papers.map((paper) => paper.term)) ?? ''
  const label = PYQ_EXAM_LABEL[found.exam]
  const subject = SEARCH_NAMES[course.code] ?? course.shortName
  return buildMetadata({
    settings,
    path,
    template: 'pyq_exam',
    vars: {
      course: course.name,
      short: course.shortName,
      code: course.code,
      exam: PYQ_EXAM_LABEL[found.exam],
      count: papers.length,
    },
    fallbackTitle: pickTitle(
      found.exam === 'qualifier'
        ? [
            `IITM Qualifier ${subject} PYQ: Question Papers ${years}`,
            `IITM Qualifier ${subject} PYQ: Previous Year Question Papers`,
            `IITM Qualifier ${subject} PYQ`,
          ]
        : [
            `IITM BS ${course.shortName} ${label} PYQ: Previous Year Question Papers`,
            `IITM BS ${course.shortName} ${label} PYQ: Question Papers ${years}`,
            `IITM BS ${course.shortName} ${label} PYQ`,
          ],
    ),
    fallbackDescription: description(course, found.exam, papers.length, span),
    keywords: pyqKeywords(course, [found.exam], { withoutExam: false }),
    override: overrides[path],
  })
}

export default async function PyqExamPage({ params }: PageProps<'/pyq/[slug]/[exam]'>) {
  const { slug, exam } = await params
  const [found, pyqPage, notes] = await Promise.all([
    resolve(slug, exam),
    getPage('pyq'),
    getNoteCourses(),
  ])
  if (!found) {
    if (isPyqExam(exam)) return redirectOrNotFound(pyqExamPath(slug, exam))
    notFound()
  }
  const { course, papers } = found
  const path = pyqExamPath(course.slug, found.exam)
  const label = PYQ_EXAM_LABEL[found.exam]
  const span = paperSpan(papers)
  const title = pageTitle(course, found.exam)
  const notesPage = notes.find((note) => note.id === course.id)
  const hub = (PYQ_HUB_EXAMS as readonly string[]).includes(found.exam)
    ? pyqHubPath(found.exam as PyqHubExam)
    : null

  return (
    <>
      <PageContext type="pyq_exam" entityId={course.id} />
      <PageHeader
        crumbs={[
          { name: pyqPage?.title.split(':')[0] ?? 'PYQs', path: PYQ_PATH },
          { name: course.shortName, path: course.path },
          { name: label, path },
        ]}
        title={title}
        meta={
          <>
            <Badge tone="accent">{course.code}</Badge>
            <Badge>
              {papers.length} {papers.length === 1 ? 'paper' : 'papers'}
            </Badge>
            {span ? <Badge>{span}</Badge> : null}
          </>
        }
      />
      <div className="container-page py-8 sm:py-10">
        <div className="container-reading space-y-8">
          <TabNav
            label={`${course.shortName} papers by exam`}
            items={[
              { href: pyqCoursePath(course.slug), label: `All (${course.paperCount})` },
              ...course.exams.map((other) => ({
                href: pyqExamPath(course.slug, other),
                label: `${PYQ_EXAM_LABEL[other]} (${course.examCounts[other] ?? 0})`,
                current: other === found.exam,
              })),
            ]}
          />

          <PaperList
            papers={papers}
            label={`${course.shortName} ${label} previous year papers`}
            showExam={false}
          />

          {notesPage || hub ? (
            <p className="flex flex-wrap gap-x-6 gap-y-2 text-small">
              {notesPage ? (
                <Link
                  href={notesPage.path}
                  className="text-accent-ink underline underline-offset-2"
                >
                  {course.shortName} notes for {label} revision
                </Link>
              ) : null}
              {hub ? (
                <Link href={hub} className="text-accent-ink underline underline-offset-2">
                  {found.exam === 'qualifier'
                    ? 'Qualifier PYQs for every subject'
                    : `${label} PYQs for every course`}
                </Link>
              ) : null}
            </p>
          ) : null}

          <FaqAccordion faqs={pyqFaqs(course, papers, found.exam)} title="Common questions" />
        </div>
      </div>
      <JsonLd
        data={notesCollectionJsonLd({
          name: title,
          description: description(course, found.exam, papers.length, span),
          path,
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
