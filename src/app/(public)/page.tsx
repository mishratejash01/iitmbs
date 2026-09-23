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
import { Button } from '@/components/ui/button'
import { SectionHeading } from '@/components/ui/section-heading'
import { getBlogPostIndex } from '@/lib/data/blog'
import { getGlobalFaqs } from '@/lib/data/faqs'
import { getLinkIndex } from '@/lib/data/links'
import { getNavItems } from '@/lib/data/navigation'
import { getChildPages } from '@/lib/data/pages'
import { getProgramPage, getPrograms } from '@/lib/data/programs'
import { getSeoOverrides } from '@/lib/data/seo-overrides'
import { getSiteSettings } from '@/lib/data/settings'
import { BLOG_PATH } from '@/lib/routes'
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
  const [settings, programs, quickLinks, deadlines, guides, faqs, linkIndex, posts] =
    await Promise.all([
      getSiteSettings(),
      getPrograms(),
      getNavItems('quick'),
      getUpcomingDeadlines(),
      getChildPages('qualifier'),
      getGlobalFaqs(),
      getLinkIndex(),
      getBlogPostIndex(),
    ])
  const programPages = (await Promise.all(programs.map((p) => getProgramPage(p.slug)))).filter(
    (page): page is NonNullable<typeof page> => page !== null,
  )
  const popular = settings.home.popular_paths.flatMap((path) => {
    const entry = linkIndex[path]
    return entry ? [{ path, title: entry.title, summary: entry.summary }] : []
  })

  const featuredPosts = posts.filter((post) => post.isFeatured).slice(0, 6)

  const heroTitle = settings.home.hero_title || settings.tagline || settings.site_name
  const heroSubtitle = settings.home.hero_subtitle || settings.description

  return (
    <>
      <PageContext type="home" />
      <JsonLd data={[organizationJsonLd(settings), websiteJsonLd(settings)]} />

      <section className="border-b border-border bg-surface">
        <div className="container-page py-10 sm:py-16">
          <h1 className="max-w-3xl text-[1.875rem] leading-[2.375rem] font-semibold tracking-tight text-text sm:text-display">
            {heroTitle}
          </h1>
          {heroSubtitle ? (
            <p className="mt-4 max-w-2xl text-muted sm:text-lg sm:leading-8">{heroSubtitle}</p>
          ) : null}

          {settings.features.search ? (
            <form action="/search" role="search" className="mt-6 flex max-w-xl gap-2">
              <label htmlFor="home-search" className="sr-only">
                Search courses, weeks and topics
              </label>
              <div className="relative flex-1">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted"
                />
                <input
                  id="home-search"
                  name="q"
                  type="search"
                  enterKeyHint="search"
                  placeholder="e.g. maths 1 week 2 graded assignment"
                  className="min-h-12 w-full rounded-control border border-border-strong bg-card pr-3 pl-10 text-body text-text placeholder:text-muted focus-visible:border-accent"
                />
              </div>
              <Button type="submit" size="lg">
                Search
              </Button>
            </form>
          ) : null}

          {quickLinks.length > 0 ? (
            <ul className="mt-5 flex flex-wrap gap-2" aria-label="Quick links">
              {quickLinks.map((link) => (
                <li key={link.id}>
                  <Link
                    href={link.href}
                    className="inline-flex min-h-10 items-center rounded-full border border-border bg-card px-4 text-small font-medium text-text hover:border-accent hover:text-accent-ink"
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
      </section>

      <div className="container-page space-y-14 py-12">
        {programPages.length > 0 ? (
          <section aria-labelledby="programmes">
            <SectionHeading
              id="programmes"
              title="Choose your programme"
              description="Every qualifier course, organised week by week."
            />
            <div className="grid gap-4 md:grid-cols-2">
              {programPages.map((page) => (
                <ProgramCard key={page.program.id} data={page} />
              ))}
            </div>
          </section>
        ) : null}

        {featuredPosts.length > 0 ? (
          <section aria-labelledby="from-the-blog">
            <SectionHeading
              id="from-the-blog"
              title="From the blog"
              description="Plain answers about admissions, fees, exams, rules and careers."
              action={{ href: BLOG_PATH, label: `All ${posts.length} posts` }}
            />
            <PostGrid posts={featuredPosts} label="Featured blog posts" />
          </section>
        ) : null}

        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-3">
            {guides.length > 0 ? (
              <section aria-labelledby="guides">
                <SectionHeading
                  id="guides"
                  title="Qualifier guides"
                  description="Rules, cut-offs and dates — checked against the official pages."
                  action={{ href: '/qualifier', label: 'How the qualifier works' }}
                />
                <LinkList items={guides} label="Qualifier guides" />
              </section>
            ) : null}
          </div>
          <div className="space-y-6 lg:col-span-2">
            <DeadlineWidget deadlines={deadlines} />
            {popular.length > 0 ? (
              <section aria-labelledby="popular">
                <h2 id="popular" className="mb-3 font-semibold text-text">
                  Popular right now
                </h2>
                <LinkList items={popular} label="Popular pages" />
              </section>
            ) : null}
          </div>
        </div>

        <FaqAccordion faqs={faqs} />
      </div>
    </>
  )
}
