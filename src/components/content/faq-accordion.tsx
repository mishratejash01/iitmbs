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
  display = false,
}: {
  faqs: Faq[]
  title?: string
  id?: string
  withSchema?: boolean
  /** A big centred title, for the homepage. */
  display?: boolean
}) {
  if (faqs.length === 0) return null
  return (
    <section aria-labelledby={id} className={display ? undefined : 'mt-12'}>
      {display ? (
        <h2
          id={id}
          className="mb-8 text-center text-[1.75rem] leading-9 font-bold tracking-tight text-text sm:text-[2.5rem] sm:leading-[3rem]"
        >
          {title}
        </h2>
      ) : (
        <SectionHeading id={id} title={title} />
      )}
      <div className="border-t border-border">
        {faqs.map((faq) => (
          <details key={faq.id} id={`faq-${faq.id}`} className="group border-b border-border">
            <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 py-4 font-medium text-text hover:text-accent-ink [&::-webkit-details-marker]:hidden">
              <span>{faq.question}</span>
              <span
                aria-hidden="true"
                className="shrink-0 text-h3 leading-none font-normal text-accent-ink group-open:hidden"
              >
                +
              </span>
              <span
                aria-hidden="true"
                className="hidden shrink-0 text-h3 leading-none font-normal text-accent-ink group-open:inline"
              >
                −
              </span>
            </summary>
            <div className="pb-5 text-muted">
              <Mdx source={faq.answerMdx} headingOffset={2} className="text-body" />
            </div>
          </details>
        ))}
      </div>
      {withSchema ? <JsonLd data={faqJsonLd(faqs)} /> : null}
    </section>
  )
}
