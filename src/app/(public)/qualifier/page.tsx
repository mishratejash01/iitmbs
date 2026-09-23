import type { Metadata } from 'next'

import { CmsRoute, cmsMetadata } from '@/components/content/cms-route'
import { FaqAccordion } from '@/components/content/faq-accordion'
import { getGlobalFaqs } from '@/lib/data/faqs'

export function generateMetadata(): Promise<Metadata> {
  return cmsMetadata('qualifier')
}

export default async function QualifierHubPage() {
  const faqs = await getGlobalFaqs()
  return (
    <>
      <CmsRoute path="qualifier" listChildren />
      <div className="container-page pb-4">
        <div className="container-reading">
          <FaqAccordion faqs={faqs} title="Qualifier FAQs" />
        </div>
      </div>
    </>
  )
}
