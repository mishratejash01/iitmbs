import type { Metadata } from 'next'

import { CmsRoute, cmsMetadata } from '@/components/content/cms-route'

export function generateMetadata(): Promise<Metadata> {
  return cmsMetadata('terms')
}

export default function Page() {
  return <CmsRoute path="terms" />
}
