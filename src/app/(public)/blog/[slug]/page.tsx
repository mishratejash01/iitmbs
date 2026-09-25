import type { Metadata } from 'next'
import Link from 'next/link'

import { PageContext } from '@/components/analytics/page-context'
import { PostGrid } from '@/components/blog/post-card'
import { FeedbackWidget } from '@/components/content/feedback-widget'
import { ShareButtons } from '@/components/content/share-buttons'
import { SourcesList } from '@/components/content/sources-list'
import { MobileToc, Toc } from '@/components/content/toc'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'
import { renderMdx } from '@/components/mdx/render'
import { JsonLd } from '@/components/seo/json-ld'
import { metaRowClasses } from '@/components/ui/badge'
import { faqsFromBody, postLanguage, relatedPosts } from '@/lib/blog/helpers'
import { getBlogPost, getBlogPostIndex } from '@/lib/data/blog'
import { getPage } from '@/lib/data/pages'
import { redirectOrNotFound } from '@/lib/data/redirects'
import { getSeoOverrides } from '@/lib/data/seo-overrides'
import { getSiteSettings } from '@/lib/data/settings'
import { getLectureCourses } from '@/lib/data/lectures'
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
  const [post, all, blogPage, noteCourses, pyqCourses, lectureCourses] = await Promise.all([
    getBlogPost(slug),
    getBlogPostIndex(),
    getPage('blog'),
    getNoteCourses(),
    getPyqCourses(),
    getLectureCourses(),
  ])
  if (!post) return redirectOrNotFound(`${BLOG_PATH}/${slug}`)

  const { content, toc } = await renderMdx(post.bodyMdx, { toc: true })
  const related = relatedPosts(post, all)
  const language = postLanguage(post.bodyMdx)
  const blogName = blogPage?.title.split(':')[0] ?? 'Blog'
  const studentNotes = noteCourses.find((n) => n.blogPostId === post.id)
  const papers = pyqCourses.find((p) => p.blogPostId === post.id)
  const lectures = lectureCourses.find((l) => l.blogPostId === post.id)

  const reviewed = post.lastReviewedAt ?? post.updatedAt
  const showToc = toc.length >= 3
  // The article and its contents list are centred together; the title and
  // closing sections share the article's column.
  const columns = 'lg:grid lg:grid-cols-[minmax(0,44rem)_15rem] lg:justify-center lg:gap-x-16'
  const sectionLabel = 'text-xs font-semibold tracking-[0.08em] text-muted uppercase'

  return (
    <>
      <PageContext type="blog_post" entityId={post.id} />
      <article className="container-page pt-10 pb-20 sm:pt-16">
        <div className={columns}>
          <header>
            <Breadcrumbs
              items={[
                { name: blogName, path: BLOG_PATH },
                { name: post.category.name, path: post.category.path },
                { name: post.title, path: post.path },
              ]}
              hideCurrent
            />
            <h1 className="text-[2.125rem] leading-[2.625rem] font-semibold tracking-[-0.02em] text-text sm:text-[3rem] sm:leading-[3.625rem]">
              {post.title}
            </h1>
            <div className="mt-8 border-y border-border py-4">
              <p className={`text-small text-muted ${metaRowClasses}`}>
                {post.author ? (
                  <span>
                    By <span className="font-medium text-text">{post.author.name}</span>
                  </span>
                ) : null}
                {post.reviewer ? (
                  <span>
                    Reviewed by <span className="font-medium text-text">{post.reviewer.name}</span>
                  </span>
                ) : null}
                {reviewed ? (
                  <span>
                    {post.lastReviewedAt ? 'Reviewed' : 'Updated'}{' '}
                    <time dateTime={reviewed}>{formatDate(reviewed)}</time>
                  </span>
                ) : null}
                <span>{post.readingMinutes} min read</span>
              </p>
            </div>
            {/* On phones the contents toggle shares the byline's bottom rule. */}
            <MobileToc items={showToc ? toc : []} className="mb-0 border-t-0" />
          </header>
        </div>

        <div className={`${columns} mt-10 sm:mt-12`}>
          <div className="min-w-0">
            {content ? (
              <div
                className="prose-content prose-article"
                lang={language === 'hi' ? 'hi' : undefined}
              >
                {content}
              </div>
            ) : null}

            {papers || studentNotes || lectures ? (
              <section
                aria-labelledby="for-this-course"
                className="mt-16 border-t border-border pt-6"
              >
                <h2 id="for-this-course" className={sectionLabel}>
                  For this course
                </h2>
                <ul className="mt-3 space-y-2">
                  {papers ? (
                    <li>
                      <Link
                        href={papers.path}
                        className="font-medium text-accent-ink underline decoration-accent-ink/30 underline-offset-4 hover:decoration-accent-ink"
                      >
                        {papers.paperCount} {papers.shortName} previous year question papers with
                        answers
                      </Link>
                    </li>
                  ) : null}
                  {lectures ? (
                    <li>
                      <Link
                        href={lectures.path}
                        className="font-medium text-accent-ink underline decoration-accent-ink/30 underline-offset-4 hover:decoration-accent-ink"
                      >
                        {lectures.videoCount} official IIT Madras {lectures.shortName} lecture
                        videos
                        {lectures.weeks.length > 0 ? ', week by week' : ''}
                      </Link>
                    </li>
                  ) : null}
                  {studentNotes ? (
                    <li>
                      <Link
                        href={studentNotes.path}
                        className="font-medium text-accent-ink underline decoration-accent-ink/30 underline-offset-4 hover:decoration-accent-ink"
                      >
                        {studentNotes.noteCount} {studentNotes.shortName} handwritten and PDF notes
                        by students
                      </Link>
                    </li>
                  ) : null}
                </ul>
              </section>
            ) : null}

            <SourcesList sources={post.sources} />

            <div className="mt-16 space-y-6 border-t border-border pt-8" data-print="hide">
              <FeedbackWidget pageType="blog_post" entityId={post.id} />
              <ShareButtons path={post.path} title={post.title} />
            </div>
          </div>

          {showToc ? (
            <aside className="hidden lg:block" data-print="hide">
              <div className="sticky top-28">
                <Toc items={toc} />
              </div>
            </aside>
          ) : null}
        </div>
      </article>

      {related.length > 0 ? (
        // Runs straight into the footer band.
        <section aria-labelledby="keep-reading" className="-mb-20 bg-surface" data-print="hide">
          <div className="container-page py-14 sm:py-16">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
              <h2 id="keep-reading" className="text-h2 font-semibold text-text">
                Keep reading
              </h2>
              <Link
                href={post.category.path}
                className="text-small font-semibold text-accent-ink underline decoration-accent-ink/30 underline-offset-4 hover:decoration-accent-ink"
              >
                More in {post.category.name}
              </Link>
            </div>
            <PostGrid posts={related} label="Related posts" />
          </div>
        </section>
      ) : null}

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
