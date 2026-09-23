import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { getLinkIndex } from '@/lib/data/links'

/**
 * <RelatedLink href="/qualifier/eligibility" /> — the title and summary come
 * from the target page, so links stay accurate when pages are renamed.
 */
export async function RelatedLink({ href, title, children }: { href?: string; title?: string; children?: ReactNode }) {
  if (!href || !href.startsWith('/')) return null
  const index = await getLinkIndex()
  const target = index[href.split('#')[0] ?? href]
  const label = children ?? title ?? target?.title ?? href

  return (
    <Link
      href={href}
      className="group inline-flex items-start gap-1.5 font-medium text-accent-ink no-underline hover:underline"
      data-track-area="related"
    >
      <span>
        {label}
        {target?.summary ? (
          <span className="mt-0.5 block text-small font-normal text-muted">{target.summary}</span>
        ) : null}
      </span>
      <ArrowRight aria-hidden="true" className="mt-1 size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}
