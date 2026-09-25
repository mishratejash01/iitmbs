import type { Metadata } from 'next'

import { PageContext } from '@/components/analytics/page-context'
import { PageHeader } from '@/components/layout/page-header'
import { CourseFilter } from '@/components/pyq/course-filter'
import { JsonLd } from '@/components/seo/json-ld'
import { getPrograms } from '@/lib/data/programs'
import { getCoursePapers, getPyqCourses, type PyqCourse } from '@/lib/data/question-papers'
import { getSeoOverrides } from '@/lib/data/seo-overrides'
import { getSiteSettings } from '@/lib/data/settings'
import { NOTE_LEVELS } from '@/lib/data/student-notes'
import { PYQ_EXAM_LABEL, PYQ_PATH, pyqExamPath, pyqHubPath, type PyqHubExam } from '@/lib/routes'
import { notesCollectionJsonLd } from '@/lib/seo/jsonld'
import { buildMetadata } from '@/lib/seo/metadata'
import { pickTitle, yearRange } from '@/lib/seo/title'

/**
 * One exam across every course, e.g. /pyq/quiz-2: students search "iitm bs
 * quiz 2 pyq" before they search for a course.
 */
async function hubData(exam: PyqHubExam) {
  const courses = (await getPyqCourses()).filter((course) => (course.examCounts[exam] ?? 0) > 0)
  const papers = courses.reduce((sum, course) => sum + (course.examCounts[exam] ?? 0), 0)
  // Years only for the qualifier: its searches carry one ("qualifier question paper 2025").
  const years =
    exam === 'qualifier'
      ? yearRange(
          (await Promise.all(courses.map((course) => getCoursePapers(course.id))))
            .flat()
            .filter((paper) => paper.exam === exam)
            .map((paper) => paper.term),
        )
      : null
  return { courses, papers, years }
}

function heading(exam: PyqHubExam): string {
  return exam === 'qualifier'
    ? 'IITM Qualifier PYQ: Previous Year Question Papers for All Subjects'
    : `IITM BS ${PYQ_EXAM_LABEL[exam]} PYQ: Previous Year Question Papers for All Courses`
}

export async function examHubMetadata(exam: PyqHubExam): Promise<Metadata> {
  const [{ courses, papers, years }, settings, overrides] = await Promise.all([
    hubData(exam),
    getSiteSettings(),
    getSeoOverrides(),
  ])
  const label = PYQ_EXAM_LABEL[exam]
  const path = pyqHubPath(exam)
  return buildMetadata({
    settings,
    path,
    fallbackTitle: pickTitle(
      exam === 'qualifier'
        ? [
            years && `IITM Qualifier PYQ: Qualifier Exam Question Papers ${years}`,
            'IITM Qualifier PYQ: Previous Year Question Papers',
          ]
        : [
            `IITM BS ${label} PYQ: Previous Year Question Papers, All Courses`,
            `IITM BS ${label} PYQ: Previous Year Question Papers`,
          ],
    ),
    fallbackDescription:
      exam === 'qualifier'
        ? `${papers} IITM BS qualifier question papers${years ? ` from ${years}` : ''} for every subject, with answers marked where shared. Pick a subject to see each paper.`
        : `IITM BS ${label} PYQs for ${courses.length} courses in one place: ${papers} previous year question papers, with answers marked where shared. Pick a course.`,
    keywords: [
      `iitm bs ${label.toLowerCase()} pyq`,
      `iitm ${label.toLowerCase()} pyq`,
      `iitm bs ${label.toLowerCase()} previous year question papers`,
      `iit madras bs ${label.toLowerCase()} question papers`,
    ],
    override: overrides[path],
  })
}

const itemTitle = (course: PyqCourse, exam: PyqHubExam) => {
  const label = PYQ_EXAM_LABEL[exam]
  const count = course.examCounts[exam] ?? 0
  return course.shortName.toLowerCase() === course.name.toLowerCase()
    ? `${course.name} ${label} PYQ (${count})`
    : `${course.shortName} ${label} PYQ: ${course.name} (${count})`
}

export async function ExamHub({ exam }: { exam: PyqHubExam }) {
  const [{ courses }, programs] = await Promise.all([hubData(exam), getPrograms()])
  const title = heading(exam)
  const path = pyqHubPath(exam)
  const known = new Set(programs.map((program) => program.slug))
  const sections = [
    ...programs.map((program) => ({
      key: program.slug,
      label: program.shortName,
      courses: courses.filter((course) => course.programSlug === program.slug),
    })),
    {
      key: 'other',
      label: '',
      courses: courses.filter((course) => !known.has(course.programSlug ?? '')),
    },
  ]
  const groups = sections
    .flatMap((section) =>
      NOTE_LEVELS.map(({ level, label }) => ({
        id: `${section.key}-${level}-${exam}`,
        heading: section.label ? `${section.label} ${label.toLowerCase()} level` : `${label} level`,
        items: section.courses
          .filter((course) => course.level === level)
          .map((course) => ({
            path: pyqExamPath(course.slug, exam),
            title: itemTitle(course, exam),
            search: `${course.shortName} ${course.name} ${course.code}`.toLowerCase(),
          })),
      })),
    )
    .filter((group) => group.items.length > 0)

  return (
    <>
      <PageContext type="pyq" />
      <PageHeader
        crumbs={[
          { name: 'IITM BS PYQs', path: PYQ_PATH },
          { name: `${PYQ_EXAM_LABEL[exam]} PYQ`, path },
        ]}
        title={title}
      />
      <div className="container-page space-y-10 py-8 sm:py-10">
        <CourseFilter groups={groups} />
      </div>
      <JsonLd
        data={notesCollectionJsonLd({
          name: title,
          description: title,
          path,
          items: courses.map((course) => ({
            name: `${course.name} ${PYQ_EXAM_LABEL[exam]} previous year question papers`,
            url: pyqExamPath(course.slug, exam),
          })),
        })}
      />
    </>
  )
}
