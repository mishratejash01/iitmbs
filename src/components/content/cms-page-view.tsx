import { PageContext } from '@/components/analytics/page-context'
import { PageHeader } from '@/components/layout/page-header'
import { renderMdx } from '@/components/mdx/render'
import { JsonLd } from '@/components/seo/json-ld'
import type { CmsPage, PageLink } from '@/lib/data/pages'
import { learningResourceJsonLd, type Crumb } from '@/lib/seo/jsonld'

import { ArticleShell } from './article-shell'
import { Byline } from './byline'
import { FaqAccordion } from './faq-accordion'
import { FeedbackWidget } from './feedback-widget'
import { LinkList } from './link-list'
import { ShareButtons } from './share-buttons'
import { SourcesList } from './sources-list'

/** Renders a CMS page (qualifier guides, about, legal pages). */
export async function CmsPageView({
  page,
  crumbs,
  childPages = [],
}: {
  page: CmsPage
  crumbs: Crumb[]
  childPages?: PageLink[]
}) {
  const { content, toc } = await renderMdx(page.bodyMdx, { toc: true })
  const isLegal = page.template === 'legal'

  return (
    <>
      <PageContext type={page.template === 'guide' ? 'guide' : 'page'} entityId={page.id} />
      <PageHeader
        crumbs={crumbs}
        title={page.title}
        meta={
          <Byline
            author={page.author}
            reviewer={page.reviewer}
            reviewedAt={page.lastReviewedAt}
            updatedAt={page.updatedAt}
          />
        }
      />
      <ArticleShell toc={isLegal ? toc : toc.length >= 3 ? toc : []}>
        {content ? <div className="prose-content">{content}</div> : null}
        {childPages.length > 0 ? (
          <section aria-labelledby="guides-list" className="mt-10">
            <h2 id="guides-list" className="mb-3 text-h3 font-semibold">
              All guides
            </h2>
            <LinkList items={childPages} label="Guides" />
          </section>
        ) : null}
        <SourcesList sources={page.sources} />
        <FaqAccordion faqs={page.faqs} />
        {!isLegal ? (
          <div className="mt-10 space-y-6">
            <FeedbackWidget pageType={page.template} entityId={page.id} />
            <ShareButtons path={`/${page.path}`} title={page.title} />
          </div>
        ) : null}
      </ArticleShell>
      {page.template === 'guide' ? (
        <JsonLd
          data={learningResourceJsonLd({
            name: page.title,
            description: page.summary ?? page.title,
            path: `/${page.path}`,
            resourceType: 'Study guide',
            teaches: [],
            author: page.author,
            reviewer: page.reviewer,
            datePublished: page.publishedAt,
            dateModified: page.updatedAt,
          })}
        />
      ) : null}
    </>
  )
}
