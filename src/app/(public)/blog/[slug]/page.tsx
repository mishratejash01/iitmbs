import { CircleArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import { Fragment } from 'react'
import Link from 'next/link'

import { PageContext } from '@/components/analytics/page-context'
import { ArticleAside, type CourseResource } from '@/components/blog/article-aside'
import { InboxSignup } from '@/components/blog/inbox-signup'
import { MoreFrom } from '@/components/blog/more-from'
import { PostCard } from '@/components/blog/post-card'
import { PostCover } from '@/components/blog/post-cover'
import { RelatedCarousel } from '@/components/blog/related-carousel'
import { FeedbackWidget } from '@/components/content/feedback-widget'
import { ShareButtons } from '@/components/content/share-buttons'
import { SourcesList } from '@/components/content/sources-list'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'
import { renderMdx } from '@/components/mdx/render'
import { JsonLd } from '@/components/seo/json-ld'
import { faqsFromBody, postLanguage, postsInCategory, relatedPosts } from '@/lib/blog/helpers'
import { segmentForPost } from '@/lib/blog/segment'
import { splitForInserts } from '@/lib/blog/split'
import { getBlogCategories, getBlogPost, getBlogPostIndex } from '@/lib/data/blog'
import { getPage } from '@/lib/data/pages'
import { redirectOrNotFound } from '@/lib/data/redirects'
import { getSeoOverrides } from '@/lib/data/seo-overrides'
import { getSiteSettings } from '@/lib/data/settings'
import { getLectureCourses } from '@/lib/data/lectures'
import { displayName } from '@/lib/settings/schema'
import { getPyqCourses } from '@/lib/data/question-papers'
import { getNoteCourses } from '@/lib/data/student-notes'
import { BLOG_PATH } from '@/lib/routes'
import { blogPostingJsonLd, faqJsonLd } from '@/lib/seo/jsonld'
import { buildMetadata } from '@/lib/seo/metadata'
import { formatDate } from '@/lib/utils/dates'
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
  const [post, all, blogPage, noteCourses, pyqCourses, categories, settings, lectureCourses] =
    await Promise.all([
      getBlogPost(slug),
      getBlogPostIndex(),
      getPage('blog'),
      getNoteCourses(),
      getPyqCourses(),
      getBlogCategories(),
      getSiteSettings(),
      getLectureCourses(),
    ])
  if (!post) return redirectOrNotFound(`${BLOG_PATH}/${slug}`)

  // The article in up to three parts, with "More from" and the inbox sign-up between them.
  const { parts } = splitForInserts(post.bodyMdx)
  const rendered = await Promise.all(parts.map((part) => renderMdx(part)))
  const related = relatedPosts(post, all, 9)
  const language = postLanguage(post.bodyMdx)
  // The editors' picks, other than this post and the related ones below it.
  const recommended = all
    .filter((p) => p.isFeatured && p.id !== post.id && !related.some((r) => r.id === p.id))
    .slice(0, 3)
  const blogName = blogPage?.title.split(':')[0] ?? 'Blog'
  const studentNotes = noteCourses.find((n) => n.blogPostId === post.id)
  const papers = pyqCourses.find((p) => p.blogPostId === post.id)
  const lectures = lectureCourses.find((l) => l.blogPostId === post.id)
  const resources: CourseResource[] = [
    ...(papers
      ? [
          {
            href: papers.path,
            kind: 'papers' as const,
            title: `${papers.shortName} previous year papers`,
          },
        ]
      : []),
    ...(lectures
      ? [
          {
            href: lectures.path,
            kind: 'lectures' as const,
            title: `${lectures.shortName} lectures by IIT Madras`,
          },
        ]
      : []),
    ...(studentNotes
      ? [
          {
            href: studentNotes.path,
            kind: 'notes' as const,
            title: `${studentNotes.shortName} notes`,
          },
        ]
      : []),
  ]
  const topics = categories
    .filter((c) => all.some((p) => p.category.id === c.id))
    .map((c) => ({ path: c.path, name: c.name }))
  const reviewed = post.lastReviewedAt ?? post.updatedAt
  const moreFrom = postsInCategory(all, post.category.id)
    .filter((p) => p.id !== post.id)
    .slice(0, 3)
  const segment = segmentForPost({
    ...post,
    courseLevel: papers?.level ?? studentNotes?.level ?? null,
  })
  const inserts = [
    <MoreFrom
      key="more-from"
      title={`More from ${post.category.name}`}
      href={post.category.path}
      posts={moreFrom}
    />,
    <InboxSignup
      key="inbox"
      segment={segment}
      sourcePath={post.path}
      sourceEntityId={post.id}
      sourceCategory={post.category.slug}
    />,
  ]

  return (
    <>
      <PageContext type="blog_post" entityId={post.id} />
      <div className="container-page pt-6 pb-16">
        <Breadcrumbs
          variant="chevron"
          items={[
            { name: blogName, path: BLOG_PATH },
            { name: post.title, path: post.path },
          ]}
        />
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_25rem] lg:gap-x-6">
          <article className="min-w-0">
            <header>
              <h1 className="text-[1.75rem] leading-[2.5rem] font-bold text-text sm:text-[2rem] sm:leading-[3rem]">
                {post.title}
              </h1>
              <p className="mt-2 text-base text-muted">
                {post.author ? <span>{post.author.name}</span> : null}
                {post.author && reviewed ? (
                  <span aria-hidden="true" className="px-2 text-border-strong">
                    |
                  </span>
                ) : null}
                {reviewed ? <time dateTime={reviewed}>{formatDate(reviewed)}</time> : null}
              </p>
              <PostCover post={post} size="large" className="mt-6" />
            </header>

            <div className="mt-8">
              {rendered.map(({ content }, index) => (
                <Fragment key={index}>
                  {content ? (
                    <div
                      className="prose-content prose-article"
                      lang={language === 'hi' ? 'hi' : undefined}
                    >
                      {content}
                    </div>
                  ) : null}
                  {/* Whatever the article is too short to hold goes after it. */}
                  {index < rendered.length - 1 ? inserts[index] : inserts.slice(index)}
                </Fragment>
              ))}
            </div>

            <SourcesList sources={post.sources} />

            <div className="mt-10 space-y-6 border-t border-border pt-8" data-print="hide">
              <FeedbackWidget pageType="blog_post" entityId={post.id} />
              <ShareButtons path={post.path} title={post.title} />
            </div>
          </article>

          <aside className="mt-14 lg:mt-0" data-print="hide">
            <ArticleAside
              resources={resources}
              recommended={recommended}
              topics={topics}
              seeAllHref={BLOG_PATH}
              siteName={displayName(settings)}
            />
          </aside>
        </div>

        <div className="mt-16" data-print="hide">
          {related.length > 0 ? (
            <RelatedCarousel
              id="related-articles"
              title="Related articles"
              items={related.map((p) => ({ key: p.id, node: <PostCard post={p} /> }))}
            />
          ) : null}
          <div className="mt-12 text-center">
            <Link
              href={BLOG_PATH}
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-surface px-6 text-[1.125rem] font-medium text-text transition-colors hover:bg-accent-soft"
            >
              <CircleArrowLeft aria-hidden="true" className="size-5" />
              Back to the blog
            </Link>
          </div>
        </div>
      </div>

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
            inLanguage: language === 'hi' ? 'hi-IN' : 'en-IN',
          }),
          faqJsonLd(faqsFromBody(post.id, post.bodyMdx)),
        ]}
      />
    </>
  )
}
