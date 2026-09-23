import type { Metadata } from 'next'

import { PageContext } from '@/components/analytics/page-context'
import { PostGrid } from '@/components/blog/post-card'
import { LinkList } from '@/components/content/link-list'
import { PageHeader } from '@/components/layout/page-header'
import { renderMdx } from '@/components/mdx/render'
import { getBlogCategories, getBlogPostIndex, postsInCategory } from '@/lib/data/blog'
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
  const { content } = await renderMdx(category.introMdx)
  const others = categories
    .filter((c) => c.id !== category.id && all.some((post) => post.category.id === c.id))
    .map((c) => ({ path: c.path, title: c.name, summary: c.description }))
  const blogName = blogPage?.title.split(':')[0] ?? 'Blog'

  return (
    <>
      <PageContext type="blog_category" entityId={category.id} />
      <PageHeader
        crumbs={[
          { name: blogName, path: BLOG_PATH },
          { name: category.name, path: category.path },
        ]}
        title={category.name}
        description={category.description}
        meta={
          <p className="text-small text-muted">
            {posts.length} {posts.length === 1 ? 'post' : 'posts'}
          </p>
        }
      />
      <div className="container-page py-8 sm:py-10">
        {content ? <div className="prose-content container-reading mb-8">{content}</div> : null}
        <PostGrid posts={posts} label={`Posts in ${category.name}`} showCategory={false} />
        {others.length > 0 ? (
          <section aria-labelledby="other-topics" className="container-reading mt-12">
            <h2 id="other-topics" className="mb-3 text-h3 font-semibold">
              More topics
            </h2>
            <LinkList items={others} label="Other blog categories" />
          </section>
        ) : null}
      </div>
    </>
  )
}
