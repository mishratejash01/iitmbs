import type { Metadata } from 'next'

import { CmsRoute, cmsMetadata } from '@/components/content/cms-route'
import { JsonLd } from '@/components/seo/json-ld'
import { getPage, getPagePaths } from '@/lib/data/pages'
import { blogPostingJsonLd } from '@/lib/seo/jsonld'
import { PLACEHOLDER_SEGMENT, withPlaceholder } from '@/lib/static-params'

export async function generateStaticParams() {
  const slugs = await getPagePaths('compare')
  return withPlaceholder(
    slugs.map((slug) => ({ slug })),
    { slug: PLACEHOLDER_SEGMENT },
  )
}

export async function generateMetadata({
  params,
}: PageProps<'/compare/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  return cmsMetadata(`compare/${slug}`)
}

/** A comparison of this site with another IITM BS study site (CMS page, article markup). */
export default async function ComparisonPage({ params }: PageProps<'/compare/[slug]'>) {
  const { slug } = await params
  const path = `compare/${slug}`
  const page = await getPage(path)
  return (
    <>
      <CmsRoute path={path} />
      {page ? (
        <JsonLd
          data={blogPostingJsonLd({
            headline: page.seo.seoTitle ?? page.title,
            description: page.summary ?? page.title,
            path: `/${page.path}`,
            section: 'Comparisons',
            keywords: page.seo.keywords,
            wordCount: page.bodyMdx.split(/\s+/).filter(Boolean).length,
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
