import type { Metadata } from 'next'
import Link from 'next/link'

import { PageContext } from '@/components/analytics/page-context'
import { CourseCard } from '@/components/content/course-card'
import { FaqAccordion } from '@/components/content/faq-accordion'
import { LinkList } from '@/components/content/link-list'
import { PageHeader } from '@/components/layout/page-header'
import { renderMdx } from '@/components/mdx/render'
import { EmptyState } from '@/components/ui/empty-state'
import { SectionHeading } from '@/components/ui/section-heading'
import { topPosts } from '@/lib/blog/helpers'
import { getBlogPostIndex } from '@/lib/data/blog'
import { getChildPages } from '@/lib/data/pages'
import { getProgramPage, getProgramSlugs } from '@/lib/data/programs'
import { redirectOrNotFound } from '@/lib/data/redirects'
import { getSeoOverrides } from '@/lib/data/seo-overrides'
import { getSiteSettings } from '@/lib/data/settings'
import { BLOG_PATH } from '@/lib/routes'
import { buildMetadata } from '@/lib/seo/metadata'
import { PLACEHOLDER_SEGMENT, withPlaceholder } from '@/lib/static-params'

export async function generateStaticParams() {
  const slugs = await getProgramSlugs()
  return withPlaceholder(
    slugs.map((program) => ({ program })),
    { program: PLACEHOLDER_SEGMENT },
  )
}

export async function generateMetadata({ params }: PageProps<'/[program]'>): Promise<Metadata> {
  const { program } = await params
  const [data, settings, overrides] = await Promise.all([
    getProgramPage(program),
    getSiteSettings(),
    getSeoOverrides(),
  ])
  if (!data) return { robots: { index: false } }
  return buildMetadata({
    settings,
    path: data.program.path,
    template: 'program',
    vars: { program: data.program.shortName, program_name: data.program.name },
    fallbackTitle: `IITM BS ${data.program.shortName} Qualifier`,
    fallbackDescription: data.program.description ?? data.program.name,
    seo: data.program.seo,
    override: overrides[data.program.path],
  })
}

export default async function ProgramPage({ params }: PageProps<'/[program]'>) {
  const { program } = await params
  const [data, guides, posts] = await Promise.all([
    getProgramPage(program),
    getChildPages('qualifier'),
    getBlogPostIndex(),
  ])
  if (!data) return redirectOrNotFound(`/${program}`)
  const programPosts = topPosts(
    posts.filter((post) => post.program?.slug === data.program.slug),
    8,
  )
  const intro = await renderMdx(data.program.introMdx)

  return (
    <>
      <PageContext type="program" entityId={data.program.id} />
      <PageHeader
        crumbs={[{ name: data.program.shortName, path: data.program.path }]}
        eyebrow={data.program.name}
        title={`IITM BS ${data.program.shortName} Qualifier`}
        description={data.program.description}
      />
      <div className="container-page space-y-12 py-8 sm:py-10">
        {intro.content ? (
          <div className="prose-content container-reading">{intro.content}</div>
        ) : null}

        <section aria-labelledby="courses">
          <SectionHeading
            id="courses"
            title="Qualifier courses"
            description="Weeks 1–4 of each course are part of the qualifier."
          />
          {data.courses.length > 0 ? (
            <ul className="grid gap-4 md:grid-cols-2">
              {data.courses.map((course) => (
                <li key={course.id}>
                  <CourseCard course={course} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Courses are on the way" description="Check back soon." />
          )}
        </section>

        {data.weeks.length > 0 ? (
          <section aria-labelledby="by-week">
            <SectionHeading
              id="by-week"
              title="Browse by week"
              description="Every course's notes and graded assignment for the same week."
            />
            <ul className="flex flex-wrap gap-2">
              {data.weeks.map((week) => (
                <li key={week.number}>
                  <Link
                    href={week.path}
                    className="inline-flex min-h-11 items-center rounded-full border border-border bg-card px-5 font-medium text-text hover:border-accent hover:text-accent-ink"
                  >
                    Week {week.number}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {guides.length > 0 ? (
          <section aria-labelledby="guides" className="container-reading">
            <SectionHeading id="guides" title="Qualifier guides" />
            <LinkList items={guides} label="Qualifier guides" />
          </section>
        ) : null}

        {programPosts.length > 0 ? (
          <section aria-labelledby="program-posts" className="container-reading">
            <SectionHeading
              id="program-posts"
              title={`${data.program.shortName} guides from the blog`}
              action={{ href: BLOG_PATH, label: 'All posts' }}
            />
            <LinkList items={programPosts} label={`${data.program.shortName} blog posts`} />
          </section>
        ) : null}

        <div className="container-reading">
          <FaqAccordion faqs={data.faqs} title={`${data.program.shortName} qualifier FAQs`} />
        </div>
      </div>
    </>
  )
}
