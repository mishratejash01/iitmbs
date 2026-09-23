import type { Metadata } from 'next'
import Link from 'next/link'

import { PageContext } from '@/components/analytics/page-context'
import { ArticleShell } from '@/components/content/article-shell'
import { Byline } from '@/components/content/byline'
import { FeedbackWidget } from '@/components/content/feedback-widget'
import { LinkList } from '@/components/content/link-list'
import { ShareButtons } from '@/components/content/share-buttons'
import { SourcesList } from '@/components/content/sources-list'
import { PageHeader } from '@/components/layout/page-header'
import { renderMdx } from '@/components/mdx/render'
import { JsonLd } from '@/components/seo/json-ld'
import { Badge } from '@/components/ui/badge'
import { faqsFromBody, relatedPosts } from '@/lib/blog/helpers'
import { getBlogPost, getBlogPostIndex } from '@/lib/data/blog'
import { getPage } from '@/lib/data/pages'
import { redirectOrNotFound } from '@/lib/data/redirects'
import { getSeoOverrides } from '@/lib/data/seo-overrides'
import { getSiteSettings } from '@/lib/data/settings'
import { BLOG_PATH } from '@/lib/routes'
import { blogPostingJsonLd, faqJsonLd } from '@/lib/seo/jsonld'
import { buildMetadata } from '@/lib/seo/metadata'
import { PLACEHOLDER_SEGMENT, withPlaceholder } from '@/lib/static-params'

export async function generateStaticParams() {
  const posts = await getBlogPostIndex()
  return withPlaceholder(
    posts.map((post) => ({ slug: post.slug })),
    { slug: PLACEHOLDER_SEGMENT },
  )
}

export async function generateMetadata({ params }: PageProps<'/blog/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const [post, settings, overrides] = await Promise.all([
    getBlogPost(slug),
    getSiteSettings(),
    getSeoOverrides(),
  ])
  if (!post) return { robots: { index: false } }
  return buildMetadata({
    settings,
    path: post.path,
    template: 'blog_post',
    vars: { post: post.title, category: post.category.name },
    fallbackTitle: `${post.title} | ${settings.site_name}`,
    fallbackDescription: post.summary ?? post.title,
    seo: post.seo,
    override: overrides[post.path],
    type: 'article',
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt,
  })
}

export default async function BlogPostPage({ params }: PageProps<'/blog/[slug]'>) {
  const { slug } = await params
  const [post, all, blogPage] = await Promise.all([
    getBlogPost(slug),
    getBlogPostIndex(),
    getPage('blog'),
  ])
  if (!post) return redirectOrNotFound(`${BLOG_PATH}/${slug}`)

  const { content, toc } = await renderMdx(post.bodyMdx, { toc: true })
  const related = relatedPosts(post, all)
  const blogName = blogPage?.title.split(':')[0] ?? 'Blog'

  return (
    <>
      <PageContext type="blog_post" entityId={post.id} />
      <PageHeader
        crumbs={[
          { name: blogName, path: BLOG_PATH },
          { name: post.category.name, path: post.category.path },
          { name: post.title, path: post.path },
        ]}
        eyebrow={
          <Link href={post.category.path} className="hover:underline">
            {post.category.name}
          </Link>
        }
        title={post.title}
        description={post.summary}
        meta={
          <>
            <Byline
              author={post.author}
              reviewer={post.reviewer}
              reviewedAt={post.lastReviewedAt}
              updatedAt={post.updatedAt}
            />
            <Badge>{post.readingMinutes} min read</Badge>
            {post.program ? <Badge tone="accent">{post.program.shortName}</Badge> : null}
          </>
        }
      />
      <ArticleShell toc={toc.length >= 3 ? toc : []}>
        {content ? <div className="prose-content">{content}</div> : null}
        <SourcesList sources={post.sources} />
        {related.length > 0 ? (
          <section aria-labelledby="read-next" className="mt-10" data-print="hide">
            <h2 id="read-next" className="mb-3 text-h3 font-semibold">
              Read next
            </h2>
            <LinkList items={related} label="Related posts" />
            <p className="mt-3 text-small">
              <Link
                href={post.category.path}
                className="text-accent-ink underline underline-offset-2"
              >
                All posts in {post.category.name}
              </Link>
            </p>
          </section>
        ) : null}
        <div className="mt-10 space-y-6">
          <FeedbackWidget pageType="blog_post" entityId={post.id} />
          <ShareButtons path={post.path} title={post.title} />
        </div>
      </ArticleShell>
      <JsonLd
        data={[
          blogPostingJsonLd({
            headline: post.title,
            description: post.summary ?? post.title,
            path: post.path,
            section: post.category.name,
            keywords: [...post.tags, ...post.seo.keywords],
            wordCount: post.wordCount,
            author: post.author,
            reviewer: post.reviewer,
            datePublished: post.publishedAt,
            dateModified: post.updatedAt,
          }),
          faqJsonLd(faqsFromBody(post.id, post.bodyMdx)),
        ]}
      />
    </>
  )
}
