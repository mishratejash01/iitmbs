import { ChevronDown } from 'lucide-react'

import { Mdx } from '@/components/mdx/render'
import { JsonLd } from '@/components/seo/json-ld'
import { SectionHeading } from '@/components/ui/section-heading'
import type { Faq } from '@/lib/data/types'
import { faqJsonLd } from '@/lib/seo/jsonld'

/**
 * FAQs as native disclosures (keyboard and screen-reader friendly, no JS),
 * plus FAQPage structured data for exactly the questions shown.
 */
export function FaqAccordion({
  faqs,
  title = 'Frequently asked questions',
  id = 'faq',
  withSchema = true,
}: {
  faqs: Faq[]
  title?: string
  id?: string
  withSchema?: boolean
}) {
  if (faqs.length === 0) return null
  return (
    <section aria-labelledby={id} className="mt-12">
      <SectionHeading id={id} title={title} />
      <div className="divide-y divide-border rounded-card border border-border bg-card">
        {faqs.map((faq) => (
          <details key={faq.id} id={`faq-${faq.id}`} className="group">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 font-medium text-text [&::-webkit-details-marker]:hidden">
              <span>{faq.question}</span>
              <ChevronDown
                aria-hidden="true"
                className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180"
              />
            </summary>
            <div className="px-4 pb-4 text-muted">
              <Mdx source={faq.answerMdx} headingOffset={2} className="text-body" />
            </div>
          </details>
        ))}
      </div>
      {withSchema ? <JsonLd data={faqJsonLd(faqs)} /> : null}
    </section>
  )
}
