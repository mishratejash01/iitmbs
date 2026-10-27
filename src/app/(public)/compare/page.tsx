import type { Metadata } from 'next'

import { CmsRoute, cmsMetadata } from '@/components/content/cms-route'

export function generateMetadata(): Promise<Metadata> {
  return cmsMetadata('compare')
}

export default function CompareHubPage() {
  return <CmsRoute path="compare" listChildren childrenTitle="All comparisons" />
}
