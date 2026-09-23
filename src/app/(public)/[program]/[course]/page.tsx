import { ExternalLink } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { PageContext } from '@/components/analytics/page-context'
import { BookmarkButton } from '@/components/content/bookmark-button'
import { FaqAccordion } from '@/components/content/faq-accordion'
import { LinkList } from '@/components/content/link-list'
import { ResourceList } from '@/components/content/resource-list'
import { ShareButtons } from '@/components/content/share-buttons'
import { WeekGrid } from '@/components/content/week-grid'
import { PageHeader } from '@/components/layout/page-header'
import { renderMdx } from '@/components/mdx/render'
import { ProgramWeekView } from '@/components/program/program-week-view'
import { JsonLd } from '@/components/seo/json-ld'
import { Badge } from '@/components/ui/badge'
import { SectionHeading } from '@/components/ui/section-heading'
import { getCourseParams, getCoursePage } from '@/lib/data/courses'
import { getProgramPage, getPrograms } from '@/lib/data/programs'
import { getSeoOverrides } from '@/lib/data/seo-overrides'
import { getSiteSettings } from '@/lib/data/settings'
import { getProgramWeek } from '@/lib/data/weeks'
import { parseWeekSegment } from '@/lib/routes'
import { courseJsonLd } from '@/lib/seo/jsonld'
import { buildMetadata } from '@/lib/seo/metadata'
import { courseVars } from '@/lib/seo/vars'
import { PLACEHOLDER_SEGMENT, withPlaceholder } from '@/lib/static-params'

/**
 * Serves two shapes of URL: /<programme>/<course> (course hub) and
 * /<programme>/week-<n> (cross-course week hub). Course slugs can never look
 * like "week-<n>" (enforced by a database constraint).
 */
export async function generateStaticParams() {
  const [courses, programs] = await Promise.all([getCourseParams(), getPrograms()])
  const weekHubs = (
    await Promise.all(
      programs.map(async (program) => {
        const page = await getProgramPage(program.slug)
        return (page?.weeks ?? []).map((w) => ({ program: program.slug, course: `week-${w.number}` }))
      }),
    )
  ).flat()
  return withPlaceholder([...courses, ...weekHubs], { program: PLACEHOLDER_SEGMENT, course: PLACEHOLDER_SEGMENT })
}

export async function generateMetadata({ params }: PageProps<'/[program]/[course]'>): Promise<Metadata> {
  const { program, course } = await params
  const [settings, overrides] = await Promise.all([getSiteSettings(), getSeoOverrides()])
  const weekNumber = parseWeekSegment(course)

  if (weekNumber !== null) {
    const data = await getProgramWeek(program, weekNumber)
    if (!data) return { robots: { index: false } }
    const path = `/${program}/week-${weekNumber}`
    return buildMetadata({
      settings,
      path,
      template: 'program_week',
      vars: { program: data.programShortName, n: weekNumber, year: settings.current_term?.split('-')[0] },
      fallbackTitle: `IITM BS ${data.programShortName} Week ${weekNumber} Graded Assignments & Notes`,
      fallbackDescription: `Week ${weekNumber} notes and graded assignment help for every ${data.programShortName} qualifier course.`,
      noindex: !data.hasContent,
      override: overrides[path],
    })
  }

  const data = await getCoursePage(program, course)
  if (!data) return { robots: { index: false } }
  return buildMetadata({
    settings,
    path: data.course.path,
    template: 'course',
    vars: courseVars(data),
    fallbackTitle: `IITM ${data.course.shortName} – ${data.course.name}`,
    fallbackDescription: data.course.description ?? data.course.name,
    seo: data.course.seo,
    override: overrides[data.course.path],
  })
}

export default async function CoursePage({ params }: PageProps<'/[program]/[course]'>) {
  const { program, course } = await params
  const weekNumber = parseWeekSegment(course)

  if (weekNumber !== null) {
    const data = await getProgramWeek(program, weekNumber)
    if (!data) notFound()
    return <ProgramWeekView data={data} />
  }

  const data = await getCoursePage(program, course)
  if (!data) notFound()
  const { course: c } = data
  const intro = await renderMdx(c.introMdx)
  const title = `IITM ${c.shortName}: ${c.name}`
  const aliases = c.aliases.filter((a) => !/^[a-z]{2,4}\d{4}$/i.test(a) && a.toLowerCase() !== c.shortName.toLowerCase()).slice(0, 4)
  const formulaSheet = data.notes.find((n) => n.kind === 'formula_sheet')
  const examPrep = data.notes.find((n) => n.kind === 'exam_prep')
  const topicNotes = data.notes.filter((n) => n.kind === 'topic')
  const courseResources = data.resources.filter((r) => r.weekId === null)

  return (
    <>
      <PageContext type="course" entityId={c.id} />
      <PageHeader
        crumbs={[
          { name: c.program.shortName, path: c.program.path },
          { name: c.shortName, path: c.path },
        ]}
        eyebrow={`IITM BS ${c.program.shortName} qualifier${c.code ? ` · ${c.code}` : ''}`}
        title={title}
        description={
          <>
            {c.description}
            {aliases.length > 0 ? (
              <span className="mt-2 block text-small">Also searched as {aliases.map((a) => `“${a}”`).join(', ')}.</span>
            ) : null}
          </>
        }
        meta={
          <>
            <Badge tone="accent">{c.weeksCount} qualifier weeks</Badge>
            {c.credits ? <Badge>{c.credits} credits</Badge> : null}
            {c.alsoIn.map((p) => (
              <Badge key={p.id}>Also in {p.shortName}</Badge>
            ))}
          </>
        }
        actions={<BookmarkButton title={title} entityType="course" entityId={c.id} />}
      />

      <div className="container-page space-y-12 py-8 sm:py-10">
        {intro.content ? <div className="prose-content container-reading">{intro.content}</div> : null}

        <section aria-labelledby="weeks">
          <SectionHeading id="weeks" title="Week by week" description="Notes, graded assignment help and practice for each qualifier week." />
          <WeekGrid weeks={data.weeks} />
        </section>

        {formulaSheet || examPrep || topicNotes.length > 0 ? (
          <section aria-labelledby="study" className="container-reading">
            <SectionHeading id="study" title="Revise the whole course" />
            <LinkList
              label="Course study material"
              items={[
                ...(formulaSheet ? [{ path: formulaSheet.path, title: `${c.shortName} formula sheet`, summary: formulaSheet.summary }] : []),
                ...(examPrep ? [{ path: examPrep.path, title: `${c.shortName} qualifier exam preparation`, summary: examPrep.summary }] : []),
                ...topicNotes.map((n) => ({ path: n.path, title: n.title, summary: n.summary })),
              ]}
            />
          </section>
        ) : null}

        {courseResources.length > 0 ? (
          <section aria-labelledby="resources" className="container-reading">
            <SectionHeading id="resources" title="Downloads and links" />
            <ResourceList items={courseResources} />
          </section>
        ) : null}

        <div className="container-reading">
          <FaqAccordion faqs={data.faqs} title={`${c.shortName} FAQs`} />
          {c.officialUrl ? (
            <p className="mt-8 text-small text-muted">
              Official course page:{' '}
              <a href={c.officialUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-accent-ink underline">
                {c.name} on study.iitm.ac.in <ExternalLink aria-hidden="true" className="size-3.5" />
              </a>
            </p>
          ) : null}
          <div className="mt-6">
            <ShareButtons path={c.path} title={title} />
          </div>
          {data.siblings.length > 0 ? (
            <p className="mt-8 text-small text-muted">
              Other {c.program.shortName} courses:{' '}
              {data.siblings.map((s, i) => (
                <span key={s.id}>
                  {i > 0 ? ' · ' : ''}
                  <Link href={s.path} className="font-medium text-accent-ink hover:underline">
                    {s.shortName}
                  </Link>
                </span>
              ))}
            </p>
          ) : null}
        </div>
      </div>

      <JsonLd
        data={courseJsonLd({
          name: c.name,
          code: c.code,
          description: c.description,
          path: c.path,
          officialUrl: c.officialUrl,
          topics: data.weeks.flatMap((w) => w.topics),
        })}
      />
    </>
  )
}
