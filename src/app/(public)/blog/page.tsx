import { ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { PageContext } from '@/components/analytics/page-context'
import { PostGrid } from '@/components/blog/post-card'
import { TopicPills } from '@/components/blog/topic-pills'
import { cmsMetadata } from '@/components/content/cms-route'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'
import { postsInCategory } from '@/lib/blog/helpers'
import { getBlogCategories, getBlogPostIndex } from '@/lib/data/blog'
import { getPage } from '@/lib/data/pages'
import { redirectOrNotFound } from '@/lib/data/redirects'
import { BLOG_PATH } from '@/lib/routes'

const FEATURED_LIMIT = 6
// Per topic on this page; the topic page lists the rest. Keeps the page (and
// its prefetch from the site header) small however many posts there are.
const TOPIC_LIMIT = 6

export async function generateMetadata(): Promise<Metadata> {
  const metadata = await cmsMetadata('blog')
  return {
    ...metadata,
    alternates: {
      ...metadata.alternates,
      types: { 'application/rss+xml': `${BLOG_PATH}/rss.xml` },
    },
  }
}

/**
 * The blog index. Its title and SEO come from the CMS page "blog". A plain,
 * centred title, the popular topics, then featured posts and the latest posts
 * of every topic as a grid of banner cards.
 */
export default async function BlogIndexPage() {
  const [page, categories, posts] = await Promise.all([
    getPage('blog'),
    getBlogCategories(),
    getBlogPostIndex(),
  ])
  if (!page) return redirectOrNotFound(BLOG_PATH)

  const featured = posts.filter((post) => post.isFeatured).slice(0, FEATURED_LIMIT)
  const sections = categories
    .map((category) => ({ category, posts: postsInCategory(posts, category.id) }))
    .filter((section) => section.posts.length > 0)
  // "IITM BS Blog: Plain Answers About…" shows as a name and a tagline.
  const [blogName = page.title, ...rest] = page.title.split(':')
  const tagline = rest.join(':').trim()

  return (
    <>
      <PageContext type="blog" entityId={page.id} />

      <div className="container-page pt-6 pb-4">
        <Breadcrumbs items={[{ name: blogName, path: BLOG_PATH }]} />
        <header className="mx-auto max-w-3xl pt-2 text-center">
          <h1 className="text-text">
            <span className="block text-[2.25rem] leading-[3rem] font-bold sm:text-[3rem] sm:leading-[4.5rem]">
              {blogName}
            </span>
            {tagline ? (
              <span className="block text-[1.125rem] leading-7 font-normal sm:text-[1.25rem] sm:leading-[1.875rem]">
                {tagline}
              </span>
            ) : null}
          </h1>
        </header>
      </div>

      <div className="container-page space-y-14 pt-10 pb-16 sm:space-y-16">
        {sections.length > 1 ? (
          <nav aria-labelledby="popular-topics" className="text-center" data-print="hide">
            <h2
              id="popular-topics"
              className="relative inline-block pb-2 text-[1.25rem] font-semibold text-text"
            >
              #PopularTopics
              <svg
                aria-hidden="true"
                viewBox="0 0 140 8"
                preserveAspectRatio="none"
                className="absolute inset-x-0 bottom-0 h-2 w-full text-accent-ink"
              >
                <path
                  d="M2 5.5C30 1.5 60 1.5 76 3.5S120 7 138 2.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </h2>
            <TopicPills
              label="Blog topics"
              className="mx-auto mt-6 max-w-5xl justify-center"
              topics={sections.map(({ category }) => ({
                path: category.path,
                name: category.name,
              }))}
            />
          </nav>
        ) : null}

        {featured.length > 0 ? (
          <section aria-labelledby="featured">
            <h2
              id="featured"
              className="mb-5 text-[1.5rem] leading-9 font-bold text-text sm:text-[1.75rem] sm:leading-[2.625rem]"
            >
              Start here
            </h2>
            <PostGrid posts={featured} label="Featured posts" />
          </section>
        ) : null}

        {sections.map(({ category, posts: inCategory }) => (
          <section
            key={category.id}
            id={category.slug}
            aria-labelledby={`${category.slug}-heading`}
            className="scroll-mt-24"
          >
            <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4">
              <h2
                id={`${category.slug}-heading`}
                className="text-[1.5rem] leading-9 font-bold text-text sm:text-[1.75rem] sm:leading-[2.625rem]"
              >
                {category.name}
              </h2>
              {inCategory.length > TOPIC_LIMIT ? (
                <Link
                  href={category.path}
                  className="group inline-flex min-h-10 items-center gap-1 text-small font-medium text-accent-ink"
                >
                  View all
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              ) : null}
            </div>
            <PostGrid
              posts={inCategory.slice(0, TOPIC_LIMIT)}
              label={category.name}
              showTopic={false}
            />
          </section>
        ))}
      </div>
    </>
  )
}
