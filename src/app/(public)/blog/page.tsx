import type { Metadata } from 'next'
import Link from 'next/link'

import { PageContext } from '@/components/analytics/page-context'
import { PostGrid } from '@/components/blog/post-card'
import { cmsMetadata } from '@/components/content/cms-route'
import { LinkList } from '@/components/content/link-list'
import { PageHeader } from '@/components/layout/page-header'
import { metaRowClasses } from '@/components/ui/badge'
import { SectionHeading } from '@/components/ui/section-heading'
import { postsInCategory } from '@/lib/blog/helpers'
import { getBlogCategories, getBlogPostIndex } from '@/lib/data/blog'
import { getPage } from '@/lib/data/pages'
import { redirectOrNotFound } from '@/lib/data/redirects'
import { BLOG_PATH } from '@/lib/routes'

const FEATURED_LIMIT = 6
// Per topic on this page; the category page lists the rest. Keeps the page (and
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
 * The blog index. Its title, intro and SEO come from the CMS page "blog";
 * below it, featured posts and the first posts of every category, each
 * linking to its category page with the full list.
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

  return (
    <>
      <PageContext type="blog" entityId={page.id} />
      <PageHeader
        crumbs={[{ name: page.title.split(':')[0] ?? page.title, path: BLOG_PATH }]}
        title={page.title}
      />
      <div className="container-page py-8 sm:py-10">
        {sections.length > 1 ? (
          <nav aria-label="Blog topics" className="mb-10" data-print="hide">
            <ul className={`text-small ${metaRowClasses}`}>
              {sections.map(({ category, posts: inCategory }) => (
                <li key={category.id}>
                  <Link
                    href={`#${category.slug}`}
                    className="group inline-flex min-h-11 items-center gap-1.5 font-medium text-accent-ink"
                  >
                    <span className="underline decoration-accent-ink/30 underline-offset-4 group-hover:decoration-accent-ink">
                      {category.name}
                    </span>
                    <span className="text-xs font-normal text-muted">{inCategory.length}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        {featured.length > 0 ? (
          <section aria-labelledby="featured" className="mb-12">
            <SectionHeading id="featured" title="Start here" />
            <PostGrid posts={featured} label="Featured posts" />
          </section>
        ) : null}

        <div className="grid gap-10 lg:grid-cols-2">
          {sections.map(({ category, posts: inCategory }) => (
            <section
              key={category.id}
              id={category.slug}
              aria-labelledby={`${category.slug}-heading`}
              className="scroll-mt-24"
            >
              <SectionHeading
                id={`${category.slug}-heading`}
                title={category.name}
                action={{ href: category.path, label: `View all ${inCategory.length}` }}
              />
              <LinkList
                items={inCategory.slice(0, TOPIC_LIMIT).map(({ path, title }) => ({ path, title }))}
                label={category.name}
              />
            </section>
          ))}
        </div>
      </div>
    </>
  )
}
