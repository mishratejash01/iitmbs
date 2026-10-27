import type { Metadata } from 'next'

import { CmsRoute, cmsMetadata } from '@/components/content/cms-route'

export function generateMetadata(): Promise<Metadata> {
  return cmsMetadata('grade-calculator')
}

/** IITM BS course grade calculator (CMS page whose body embeds <GradeCalculator />). */
export default function GradeCalculatorPage() {
  return <CmsRoute path="grade-calculator" />
}
