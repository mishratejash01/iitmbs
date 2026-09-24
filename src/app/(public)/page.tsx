import { Search } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { PageContext } from '@/components/analytics/page-context'
import { PostGrid } from '@/components/blog/post-card'
import { DeadlineWidget } from '@/components/content/deadline-widget'
import { FaqAccordion } from '@/components/content/faq-accordion'
import { LinkList } from '@/components/content/link-list'
import { ProgramCard } from '@/components/content/program-card'
import { JsonLd } from '@/components/seo/json-ld'
import { Button, ButtonLink } from '@/components/ui/button'
import { SectionHeading } from '@/components/ui/section-heading'
import { getBlogPostIndex } from '@/lib/data/blog'
import { getGlobalFaqs } from '@/lib/data/faqs'
import { getLinkIndex } from '@/lib/data/links'
import { getNavItems } from '@/lib/data/navigation'
import { getChildPages } from '@/lib/data/pages'
import { getProgramPage, getPrograms } from '@/lib/data/programs'
import { getPyqCourses } from '@/lib/data/question-papers'
import { getSeoOverrides } from '@/lib/data/seo-overrides'
import { getSiteSettings } from '@/lib/data/settings'
import { getNoteCourses } from '@/lib/data/student-notes'
import { BLOG_PATH, NOTES_PATH, PYQ_PATH } from '@/lib/routes'
import { getUpcomingDeadlines } from '@/lib/data/upcoming'
import { organizationJsonLd, websiteJsonLd } from '@/lib/seo/jsonld'
import { buildMetadata } from '@/lib/seo/metadata'

export async function generateMetadata(): Promise<Metadata> {
  const [settings, overrides] = await Promise.all([getSiteSettings(), getSeoOverrides()])
  return buildMetadata({
    settings,
    path: '/',
    fallbackTitle: settings.seo.default_title || settings.site_name,
    fallbackDescription: settings.seo.default_description || settings.description,
    override: overrides['/'],
  })
}

export default async function HomePage() {
  const [
    settings,
    programs,
    quickLinks,
    deadlines,
    guides,
    faqs,
    linkIndex,
    posts,
    pyqCourses,
    noteCourses,
  ] = await Promise.all([
    getSiteSettings(),
    getPrograms(),
    getNavItems('quick'),
    getUpcomingDeadlines(),
    getChildPages('qualifier'),
    getGlobalFaqs(),
    getLinkIndex(),
    getBlogPostIndex(),
    getPyqCourses(),
    getNoteCourses(),
  ])
  const programPages = (await Promise.all(programs.map((p) => getProgramPage(p.slug)))).filter(
    (page): page is NonNullable<typeof page> => page !== null,
  )
  const popular = settings.home.popular_paths.flatMap((path) => {
    const entry = linkIndex[path]
    return entry ? [{ path, title: entry.title }] : []
  })

  const featuredPosts = posts.filter((post) => post.isFeatured).slice(0, 6)
  const stats = [
    {
      value: pyqCourses.reduce((sum, course) => sum + course.paperCount, 0),
      label: 'previous year papers',
      href: PYQ_PATH,
    },
    {
      value: noteCourses.reduce((sum, course) => sum + course.noteCount, 0),
      label: 'student notes',
      href: NOTES_PATH,
    },
    { value: posts.length, label: 'guides on the blog', href: BLOG_PATH },
  ].filter((stat) => stat.value > 0)

  const heroTitle = settings.home.hero_title || settings.tagline || settings.site_name

  return (
    <>
      <PageContext type="home" />
      <JsonLd data={[organizationJsonLd(settings), websiteJsonLd(settings)]} />

      <section className="bg-accent-strong text-on-accent">
        <div className="container-page grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1.35fr_1fr] lg:py-24">
          <div>
            <h1 className="max-w-2xl text-[2.25rem] leading-[2.75rem] font-semibold sm:text-display sm:leading-[3.875rem]">
              {heroTitle}
            </h1>

            {settings.features.search ? (
              <form action="/search" role="search" className="mt-8 flex max-w-xl gap-2">
                <label htmlFor="home-search" className="sr-only">
                  Search courses, weeks and topics
                </label>
                <div className="relative flex-1">
                  <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted"
                  />
                  <input
                    id="home-search"
                    name="q"
                    type="search"
                    enterKeyHint="search"
                    placeholder="e.g. maths 1 week 2"
                    className="min-h-13 w-full rounded-control border-0 bg-card pr-3 pl-11 text-body text-text placeholder:text-muted focus-visible:outline-accent-soft"
                  />
                </div>
                <Button type="submit" size="lg" variant="soft" className="min-h-13">
                  Search
                </Button>
              </form>
            ) : null}

            {quickLinks.length > 0 ? (
              <ul
                className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-small"
                aria-label="Quick links"
              >
                {quickLinks.map((link) => (
                  <li key={link.id}>
                    <Link
                      href={link.href}
                      className="font-medium text-accent-soft underline decoration-accent-soft/40 underline-offset-4 hover:decoration-accent-soft"
                      data-track="nav_click"
                      data-track-label={`quick:${link.label}`}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {stats.length > 0 ? (
            <ul
              aria-label="On this site"
              className="rounded-panel bg-accent-soft p-7 text-accent-strong sm:p-9"
            >
              {stats.map((stat, index) => (
                <li
                  key={stat.href}
                  className={index > 0 ? 'mt-5 border-t border-accent-strong/15 pt-5' : ''}
                >
                  <Link href={stat.href} className="group flex items-baseline gap-3">
                    <span className="text-[2.5rem] leading-none font-semibold tabular-nums">
                      {stat.value.toLocaleString('en-IN')}
                    </span>
                    <span className="text-body font-medium underline decoration-accent-strong/30 underline-offset-4 group-hover:decoration-accent-strong">
                      {stat.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

      <div className="container-page space-y-20 py-16 sm:py-20">
        {programPages.length > 0 ? (
          <section aria-labelledby="programmes">
            <SectionHeading id="programmes" title="Choose your programme" />
            <div className="grid gap-5 md:grid-cols-2">
              {programPages.map((page, index) => (
                <ProgramCard
                  key={page.program.id}
                  data={page}
                  tone={index % 2 === 1 ? 'teal' : 'peach'}
                />
              ))}
            </div>
          </section>
        ) : null}

        <div className="grid gap-14 lg:grid-cols-5">
          <div className="lg:col-span-3">
            {guides.length > 0 ? (
              <section aria-labelledby="guides">
                <SectionHeading
                  id="guides"
                  title="Qualifier guides"
                  action={{ href: '/qualifier', label: 'How the qualifier works' }}
                />
                <LinkList items={guides} label="Qualifier guides" />
              </section>
            ) : null}
          </div>
          <div className="space-y-10 lg:col-span-2">
            <DeadlineWidget deadlines={deadlines} />
            {popular.length > 0 ? (
              <section aria-labelledby="popular">
                <SectionHeading id="popular" title="Popular right now" as="h3" />
                <LinkList items={popular} label="Popular pages" />
              </section>
            ) : null}
          </div>
        </div>

        {featuredPosts.length > 0 ? (
          <section aria-labelledby="from-the-blog">
            <SectionHeading
              id="from-the-blog"
              title="From the blog"
              action={{ href: BLOG_PATH, label: `All ${posts.length} posts` }}
            />
            <PostGrid posts={featuredPosts} label="Featured blog posts" />
          </section>
        ) : null}

        <FaqAccordion faqs={faqs} />

        <section
          aria-labelledby="start-here"
          className="rounded-panel bg-accent-soft px-7 py-12 text-center sm:px-12 sm:py-16"
        >
          <h2
            id="start-here"
            className="text-[1.75rem] leading-9 font-semibold text-accent-strong sm:text-h1"
          >
            Starting the qualifier?
          </h2>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/qualifier" size="lg">
              Read the qualifier guide
            </ButtonLink>
            <ButtonLink href={PYQ_PATH} size="lg" variant="secondary">
              Practise with previous papers
            </ButtonLink>
          </div>
        </section>
      </div>
    </>
  )
}
