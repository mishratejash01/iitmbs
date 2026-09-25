import type { Metadata } from 'next'
import Link from 'next/link'

import { PageContext } from '@/components/analytics/page-context'
import { DeadlineWidget } from '@/components/content/deadline-widget'
import { PageHeader } from '@/components/layout/page-header'
import { JsonLd } from '@/components/seo/json-ld'
import { getLinkIndex } from '@/lib/data/links'
import { getProgramPage, getPrograms } from '@/lib/data/programs'
import { getSeoOverrides } from '@/lib/data/seo-overrides'
import { getSiteSettings } from '@/lib/data/settings'
import { getUpcomingDeadlines } from '@/lib/data/upcoming'
import { notesCollectionJsonLd } from '@/lib/seo/jsonld'
import { buildMetadata } from '@/lib/seo/metadata'
import { pickTitle } from '@/lib/seo/title'

const PATH = '/graded-assignments'
const TITLE = 'IITM BS Graded Assignments, Week by Week'
// The latest term of a week's graded assignment lives at the base path.
const GRADED = /\/week-(\d+)\/graded-assignment$/

/** Every live graded assignment page, from the link index (published weeks only). */
async function gradedLinks() {
  const index = await getLinkIndex()
  return Object.values(index).filter(
    (entry) => entry.kind === 'assignment' && GRADED.test(entry.path),
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const [settings, overrides, graded] = await Promise.all([
    getSiteSettings(),
    getSeoOverrides(),
    gradedLinks(),
  ])
  const courses = new Set(graded.map((entry) => entry.path.replace(/\/week-.*$/, ''))).size
  return buildMetadata({
    settings,
    path: PATH,
    fallbackTitle: pickTitle([
      'IITM BS Graded Assignments: Week by Week Hints for Every Course',
      TITLE,
    ]),
    fallbackDescription:
      graded.length > 0
        ? `Free IITM BS graded assignment help for ${courses} ${courses === 1 ? 'course' : 'courses'}, week by week: hints and the concepts tested before each deadline, full walkthroughs after it.`
        : 'Free IITM BS graded assignment help, week by week: hints and the concepts tested before each deadline, full walkthroughs after it.',
    keywords: [
      'iitm bs graded assignment',
      'iitm bs week 1 graded assignment',
      'iitm bs graded assignment hints',
      'iit madras bs graded assignments',
      'iitm bs ga solutions after deadline',
    ],
    // An empty hub is a thin page: keep it out of search until a week is published.
    noindex: graded.length === 0,
    override: overrides[PATH],
  })
}

/**
 * Every live graded assignment, by programme, course and week, from the link
 * index (so only published weeks are linked), with the upcoming deadlines.
 */
export default async function GradedAssignmentsPage() {
  const [programs, graded, deadlines] = await Promise.all([
    getPrograms(),
    gradedLinks(),
    getUpcomingDeadlines(),
  ])
  const pages = (await Promise.all(programs.map((p) => getProgramPage(p.slug)))).filter(
    (page): page is NonNullable<typeof page> => page !== null,
  )

  const sections = pages.map(({ program, courses }) => ({
    program,
    courses: courses.map((course) => ({
      course,
      weeks: graded
        .filter((entry) => entry.path.startsWith(`${course.path}/week-`))
        .map((entry) => ({ path: entry.path, week: Number(GRADED.exec(entry.path)?.[1]) }))
        .sort((a, b) => a.week - b.week),
    })),
  }))

  return (
    <>
      <PageContext type="page" />
      <PageHeader crumbs={[{ name: 'Graded assignments', path: PATH }]} title={TITLE} />
      <div className="container-page py-10 sm:py-12">
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-x-10">
          <div className="space-y-12">
            {sections.map(({ program, courses }) => (
              <section key={program.id} aria-labelledby={`ga-${program.slug}`}>
                <h2
                  id={`ga-${program.slug}`}
                  className="mb-5 text-[1.5rem] leading-8 font-bold tracking-tight text-text"
                >
                  {program.shortName}
                </h2>
                <ul className="grid gap-4 sm:grid-cols-2">
                  {courses.map(({ course, weeks }) => (
                    <li key={course.id} className="rounded-card border border-border bg-card p-5">
                      <Link
                        href={course.path}
                        className="font-semibold text-text hover:text-accent-ink hover:underline"
                      >
                        {course.shortName}
                      </Link>
                      {course.code ? (
                        <span className="ml-2 text-xs text-muted">{course.code}</span>
                      ) : null}
                      {weeks.length > 0 ? (
                        <ul
                          className="mt-4 flex flex-wrap gap-2"
                          aria-label={`${course.shortName} weeks`}
                        >
                          {weeks.map(({ path, week }) => (
                            <li key={path}>
                              <Link
                                href={path}
                                className="inline-flex min-h-10 items-center rounded-control border border-border-strong px-3.5 text-small text-text transition-colors hover:border-accent-ink hover:text-accent-ink"
                                data-track="nav_click"
                                data-track-label={`ga_hub:${course.shortName}:${week}`}
                              >
                                Week {week}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-4 text-small text-muted">Coming soon</p>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          <aside className="mt-12 lg:mt-0">
            <DeadlineWidget deadlines={deadlines} />
          </aside>
        </div>
      </div>
      {graded.length > 0 ? (
        <JsonLd
          data={notesCollectionJsonLd({
            name: TITLE,
            description: TITLE,
            path: PATH,
            items: graded.map((entry) => ({ name: entry.title, url: entry.path })),
          })}
        />
      ) : null}
    </>
  )
}
