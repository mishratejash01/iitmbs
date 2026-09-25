import type { Metadata } from 'next'

import { PageContext } from '@/components/analytics/page-context'
import { PostGrid } from '@/components/blog/post-card'
import { TopicPills } from '@/components/blog/topic-pills'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'
import { postsInCategory } from '@/lib/blog/helpers'
import { getBlogCategories, getBlogPostIndex } from '@/lib/data/blog'
import { getPage } from '@/lib/data/pages'
import { redirectOrNotFound } from '@/lib/data/redirects'
import { getSeoOverrides } from '@/lib/data/seo-overrides'
import { getSiteSettings } from '@/lib/data/settings'
import { BLOG_PATH, blogCategoryPath } from '@/lib/routes'
import { buildMetadata } from '@/lib/seo/metadata'
import { PLACEHOLDER_SEGMENT, withPlaceholder } from '@/lib/static-params'

export async function generateStaticParams() {
  const categories = await getBlogCategories()
  return withPlaceholder(
    categories.map((category) => ({ slug: category.slug })),
    { slug: PLACEHOLDER_SEGMENT },
  )
}

export async function generateMetadata({
  params,
}: PageProps<'/blog/category/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const [categories, posts, settings, overrides] = await Promise.all([
    getBlogCategories(),
    getBlogPostIndex(),
    getSiteSettings(),
    getSeoOverrides(),
  ])
  const category = categories.find((c) => c.slug === slug)
  if (!category) return { robots: { index: false } }
  const count = postsInCategory(posts, category.id).length
  return buildMetadata({
    settings,
    path: category.path,
    template: 'blog_category',
    vars: { category: category.name, count },
    fallbackTitle: `${category.name} | ${settings.site_name}`,
    fallbackDescription: category.description ?? category.name,
    seo: category.seo,
    override: overrides[category.path],
    // An empty category is not worth indexing until it has posts.
    noindex: count === 0,
  })
}

export default async function BlogCategoryPage({ params }: PageProps<'/blog/category/[slug]'>) {
  const { slug } = await params
  const [categories, all, blogPage] = await Promise.all([
    getBlogCategories(),
    getBlogPostIndex(),
    getPage('blog'),
  ])
  const category = categories.find((c) => c.slug === slug)
  if (!category) return redirectOrNotFound(blogCategoryPath(slug))

  const posts = postsInCategory(all, category.id)
  const others = categories
    .filter((c) => c.id !== category.id && all.some((post) => post.category.id === c.id))
    .map((c) => ({ path: c.path, name: c.name }))
  const blogName = blogPage?.title.split(':')[0] ?? 'Blog'

  return (
    <>
      <PageContext type="blog_category" entityId={category.id} />
      <header className="border-b border-border">
        <div className="container-page pt-6 pb-10 sm:pb-12">
          <Breadcrumbs
            items={[
              { name: blogName, path: BLOG_PATH },
              { name: category.name, path: category.path },
            ]}
          />
          <h1 className="text-[2rem] leading-[2.75rem] font-bold text-text sm:text-[2.5rem] sm:leading-[3.5rem]">
            {category.name}
          </h1>
          {category.description ? (
            <p className="mt-3 max-w-2xl text-[1.0625rem] leading-7 text-muted">
              {category.description}
            </p>
          ) : null}
        </div>
      </header>
      <div className="container-page py-10 sm:py-14">
        <PostGrid posts={posts} label={`Posts in ${category.name}`} showTopic={false} />
        {others.length > 0 ? (
          <nav aria-labelledby="other-topics" className="mt-16 border-t border-border pt-10">
            <h2 id="other-topics" className="mb-5 text-h3 font-semibold text-text">
              More topics
            </h2>
            <TopicPills topics={others} label="Other blog topics" />
          </nav>
        ) : null}
      </div>
    </>
  )
}
