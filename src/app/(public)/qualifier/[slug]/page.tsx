import type { Metadata } from 'next'

import { CmsRoute, cmsMetadata } from '@/components/content/cms-route'
import { getPagePaths } from '@/lib/data/pages'
import { PLACEHOLDER_SEGMENT, withPlaceholder } from '@/lib/static-params'

export async function generateStaticParams() {
  const slugs = await getPagePaths('qualifier')
  return withPlaceholder(
    slugs.map((slug) => ({ slug })),
    { slug: PLACEHOLDER_SEGMENT },
  )
}

export async function generateMetadata({
  params,
}: PageProps<'/qualifier/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  return cmsMetadata(`qualifier/${slug}`)
}

export default async function QualifierGuidePage({ params }: PageProps<'/qualifier/[slug]'>) {
  const { slug } = await params
  return <CmsRoute path={`qualifier/${slug}`} />
}
