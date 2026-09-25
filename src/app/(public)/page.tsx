import { FileText, Library, NotebookPen } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { PageContext } from '@/components/analytics/page-context'
import { PostGrid } from '@/components/blog/post-card'
import { DeadlineWidget } from '@/components/content/deadline-widget'
import { FaqAccordion } from '@/components/content/faq-accordion'
import { LinkList } from '@/components/content/link-list'
import { ProgramCard } from '@/components/content/program-card'
import { CoursePicker } from '@/components/home/course-picker'
import { DownloadIllustration } from '@/components/home/download-illustration'
import { type LevelCard, LevelCards } from '@/components/home/level-cards'
import { ResourceFlow } from '@/components/home/resource-flow'
import { type BannerLink, TermBanner } from '@/components/home/term-banner'
import { JsonLd } from '@/components/seo/json-ld'
import { ButtonLink } from '@/components/ui/button'
import { SectionHeading } from '@/components/ui/section-heading'
import { topPosts } from '@/lib/blog/helpers'
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
import { BLOG_PATH, formatTerm, NOTES_PATH, PYQ_PATH } from '@/lib/routes'
import { displayName } from '@/lib/settings/schema'
import { getUpcomingDeadlines } from '@/lib/data/upcoming'
import { buildLevels } from '@/lib/home/levels'
import { organizationJsonLd, websiteJsonLd } from '@/lib/seo/jsonld'
import { buildMetadata } from '@/lib/seo/metadata'

// Big, centred section titles in the style of the hero, and the line under them.
const displayHeading =
  'text-center text-[1.75rem] leading-9 font-bold tracking-tight text-text sm:text-[2.5rem] sm:leading-[3rem]'
const displayLead =
  'mx-auto mt-4 max-w-2xl text-center text-[1.0625rem] leading-8 text-text sm:text-[1.1875rem]'

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
  const levels = buildLevels({ programPages, noteCourses, pyqCourses })
  const degreeLevels = levels.filter((level) => level.id !== 'qualifier')
  const plural = (count: number, one: string, many: string) =>
    `${count.toLocaleString('en-IN')} ${count === 1 ? one : many}`
  const acrossCourses = (count: number) =>
    count > 0 ? `Across ${plural(count, 'course', 'courses')}` : null
  const coursesCovered = degreeLevels.reduce((sum, level) => sum + level.courses.length, 0)
  const levelSpan =
    degreeLevels.length > 1
      ? `${degreeLevels[0]?.label} to ${degreeLevels.at(-1)?.label}`
      : (degreeLevels[0]?.label ?? null)

  const stats = [
    {
      value: pyqCourses.reduce((sum, course) => sum + course.paperCount, 0),
      label: 'previous year papers',
      href: PYQ_PATH,
      icon: FileText,
      badge: acrossCourses(pyqCourses.length),
      tone: 'bg-violet',
    },
    {
      value: noteCourses.reduce((sum, course) => sum + course.noteCount, 0),
      label: 'student notes',
      href: NOTES_PATH,
      icon: NotebookPen,
      badge: acrossCourses(noteCourses.length),
      tone: 'bg-green',
    },
    {
      value: coursesCovered,
      label: 'courses covered',
      href: NOTES_PATH,
      icon: Library,
      badge: levelSpan,
      tone: 'bg-sun',
    },
  ].filter((stat) => stat.value > 0)

  const levelCards: LevelCard[] = degreeLevels.map((level) => ({
    id: level.id,
    label: level.label,
    stats: [
      plural(level.courses.length, 'course', 'courses'),
      ...(level.noteCount > 0 ? [plural(level.noteCount, 'note', 'notes')] : []),
      ...(level.paperCount > 0 ? [plural(level.paperCount, 'paper', 'papers')] : []),
    ],
    links: [
      ...(level.noteCount > 0
        ? [{ label: `${level.label} notes`, href: `${NOTES_PATH}#${level.id}-notes` }]
        : []),
      ...(level.paperCount > 0
        ? [{ label: `${level.label} papers`, href: `${PYQ_PATH}#${level.id}-pyqs` }]
        : []),
      { label: 'Lectures', href: '/resources/lectures' },
    ],
  }))
  // The picker opens on the degree's levels; the qualifier comes last, for new students.
  const pickerLevels = [
    ...degreeLevels,
    ...levels
      .filter((level) => level.id === 'qualifier')
      .map((level) => ({ ...level, label: 'Qualifier (new students)' })),
  ].map(({ id, label, courses }) => ({ id, label, courses }))

  // The current term's banner: dates from the announcement ("September 2026
  // qualifier: applications close …" → the part after the colon), official
  // application pages, then our eligibility and timeline guides if live.
  const announcement = settings.announcement.enabled ? settings.announcement.text : ''
  const datesText = announcement.includes(':')
    ? announcement.slice(announcement.indexOf(':') + 1).trim()
    : announcement
  const bannerDates = datesText ? datesText.charAt(0).toUpperCase() + datesText.slice(1) : null
  const bannerLinks: BannerLink[] = [
    ...programPages.flatMap(({ program }) =>
      program.officialUrl
        ? [{ label: `Apply for ${program.shortName}`, href: program.officialUrl, external: true }]
        : [],
    ),
    ...(linkIndex['/qualifier/eligibility']
      ? [{ label: 'Check eligibility', href: '/qualifier/eligibility' }]
      : []),
    ...(linkIndex['/qualifier/timeline']
      ? [{ label: 'See the timeline', href: '/qualifier/timeline' }]
      : []),
  ]

  const heroTitle = settings.home.hero_title || settings.tagline || settings.site_name
  const heroSubtitle = settings.home.hero_subtitle
  // "Know how the degree works": the top guide of each big-picture topic.
  const degreeGuides = ['about', 'structure', 'exams', 'rules', 'fees', 'careers']
    .flatMap((slug) =>
      topPosts(
        posts.filter((post) => post.category.slug === slug),
        1,
      ),
    )
    .map((post) => ({ path: post.path, title: post.title }))

  return (
    <>
      <PageContext type="home" />
      <JsonLd data={[organizationJsonLd(settings), websiteJsonLd(settings)]} />

      <section className="bg-accent-strong text-on-accent">
        <div className="container-page pt-12 pb-16 text-center sm:pt-20 sm:pb-24">
          <h1 className="mx-auto max-w-3xl text-[2.375rem] leading-[2.875rem] font-bold tracking-tight sm:text-[3.5rem] sm:leading-[4.125rem]">
            {heroTitle}
          </h1>
          {heroSubtitle ? (
            <p className="mx-auto mt-5 max-w-2xl text-[1.0625rem] leading-7 text-on-accent/85 sm:text-[1.1875rem] sm:leading-8">
              {heroSubtitle}
            </p>
          ) : null}

          {levels.length > 0 ? <CoursePicker levels={pickerLevels} /> : null}

          {quickLinks.length > 0 ? (
            <ul className="mt-6 flex flex-wrap justify-center gap-2" aria-label="Quick links">
              {quickLinks.map((link) => (
                <li key={link.id}>
                  <Link
                    href={link.href}
                    className="inline-flex min-h-10 items-center rounded-full bg-on-accent/10 px-4 text-small font-medium text-on-accent ring-1 ring-on-accent/25 transition-colors hover:bg-on-accent/20"
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

      {stats.length > 0 ? (
        <section aria-labelledby="on-this-site">
          <div className="container-page py-16 sm:py-20">
            <h2 id="on-this-site" className={displayHeading}>
              Free study material for every level, and counting
            </h2>
            <div className="mt-10 flex flex-col items-center gap-10 lg:mt-12 lg:flex-row lg:justify-center lg:gap-20">
              <DownloadIllustration className="w-48 shrink-0 sm:w-56 lg:w-64" />
              <ul className="flex flex-wrap justify-center gap-x-14 gap-y-10">
                {stats.map((stat) => (
                  <li key={stat.label}>
                    <Link href={stat.href} className="group flex flex-col items-center text-center">
                      <span className="text-[3.25rem] leading-none font-bold tracking-tight text-text tabular-nums sm:text-[4rem]">
                        {stat.value.toLocaleString('en-IN')}
                      </span>
                      <span className="mt-3 flex items-center gap-1.5 text-body text-muted underline decoration-transparent underline-offset-4 group-hover:text-accent-ink group-hover:decoration-accent-ink/40">
                        <stat.icon aria-hidden="true" className="size-4" />
                        {stat.label}
                      </span>
                      {stat.badge ? (
                        <span
                          className={`mt-2 rounded-full px-2.5 py-0.5 text-xs font-medium text-text ${stat.tone}`}
                        >
                          {stat.badge}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ) : null}

      <section aria-labelledby="all-resources" className="overflow-hidden bg-surface">
        <div className="container-page py-16 text-center sm:py-24">
          <h2 id="all-resources" className={displayHeading}>
            All the best IITM BS resources, in one place
          </h2>
          <p className={displayLead}>
            From your first qualifier week to your last degree course, and completely free.
          </p>
          <div className="mt-12 sm:mt-16">
            <ResourceFlow course="Your course" />
          </div>
          <ButtonLink href={NOTES_PATH} size="lg" className="mt-12 sm:mt-16">
            Explore every course
          </ButtonLink>
        </div>
      </section>

      {levelCards.length > 0 ? (
        <section aria-labelledby="levels">
          <div className="container-page py-16 sm:py-24">
            <h2 id="levels" className={displayHeading}>
              Every level of your degree
            </h2>
            <p className={displayLead}>
              Notes, previous year papers and lectures for every course, from foundation to degree.
            </p>
            <div className="mt-10 sm:mt-12">
              <LevelCards levels={levelCards} />
            </div>
          </div>
        </section>
      ) : null}

      {degreeGuides.length > 0 || popular.length > 0 || deadlines.length > 0 ? (
        <section aria-labelledby="degree-guides" className="bg-surface">
          <div className="container-page py-16 sm:py-24">
            <h2 id="degree-guides" className={displayHeading}>
              Know how the degree works
            </h2>
            <div className="mt-10 grid gap-6 sm:mt-12 lg:grid-cols-5">
              {degreeGuides.length > 0 ? (
                <div className="rounded-panel border border-border bg-card p-6 sm:p-8 lg:col-span-3">
                  <SectionHeading
                    id="guides"
                    title="Degree guides"
                    as="h3"
                    action={{ href: BLOG_PATH, label: 'All guides' }}
                  />
                  <LinkList items={degreeGuides} label="Degree guides" />
                </div>
              ) : null}
              <div className="space-y-6 lg:col-span-2">
                <DeadlineWidget deadlines={deadlines} />
                {popular.length > 0 ? (
                  <div className="rounded-panel border border-border bg-card p-6 sm:p-7">
                    <SectionHeading id="popular" title="Popular right now" as="h3" />
                    <LinkList items={popular} label="Popular pages" />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* For new students: getting in through the qualifier. */}
      {settings.current_term ? (
        <TermBanner
          brand={displayName(settings)}
          term={formatTerm(settings.current_term)}
          dates={bannerDates}
          links={bannerLinks}
        />
      ) : null}

      {programPages.length > 0 ? (
        <section aria-labelledby="programmes">
          <div className="container-page py-16 sm:py-24">
            <h2 id="programmes" className={displayHeading}>
              Choose your programme
            </h2>
            <p className={displayLead}>Qualifier help, week by week, for each programme.</p>
            <div className="mt-10 grid gap-5 sm:mt-12 md:grid-cols-2">
              {programPages.map((page, index) => (
                <ProgramCard
                  key={page.program.id}
                  data={page}
                  tone={index % 2 === 1 ? 'teal' : 'peach'}
                />
              ))}
            </div>
            {guides.length > 0 ? (
              <nav aria-labelledby="qualifier-guides" className="mt-10 text-center">
                <h3 id="qualifier-guides" className="text-small font-semibold text-text">
                  Qualifier guides
                </h3>
                <ul className="mt-4 flex flex-wrap justify-center gap-2">
                  {guides.map((guide) => (
                    <li key={guide.path}>
                      <Link
                        href={guide.path}
                        className="inline-flex min-h-10 items-center rounded-full border border-border-strong bg-card px-4 text-small text-text transition-colors hover:border-accent-ink hover:text-accent-ink"
                      >
                        {guide.title.split(':')[0]}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ) : null}
          </div>
        </section>
      ) : null}

      {featuredPosts.length > 0 ? (
        <section aria-labelledby="from-the-blog" className="bg-surface">
          <div className="container-page py-16 sm:py-24">
            <h2 id="from-the-blog" className={displayHeading}>
              Latest from the blog
            </h2>
            <div className="mt-10 sm:mt-12">
              <PostGrid posts={featuredPosts} label="Featured blog posts" />
            </div>
            <div className="mt-12 text-center">
              <ButtonLink href={BLOG_PATH} size="lg" variant="secondary">
                Read the blog
              </ButtonLink>
            </div>
          </div>
        </section>
      ) : null}

      {faqs.length > 0 ? (
        <div className="container-page py-16 sm:py-24">
          <div className="mx-auto max-w-3xl">
            <FaqAccordion faqs={faqs} display />
          </div>
        </div>
      ) : null}

      {/* The footer's top margin closes this section. */}
      <section aria-labelledby="our-mission" className="border-t border-border">
        <div className="container-page pt-16 text-center sm:pt-24">
          <h2 id="our-mission" className={displayHeading}>
            Our mission
          </h2>
          <p className={displayLead}>
            Help every IITM BS student find the right material, from the qualifier to the degree.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/about" size="lg">
              Learn more about us
            </ButtonLink>
            <ButtonLink href={NOTES_PATH} size="lg" variant="secondary">
              Browse notes
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  )
}
