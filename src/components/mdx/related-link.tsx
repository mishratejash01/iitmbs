import Link from 'next/link'
import type { ReactNode } from 'react'

import { getLinkIndex } from '@/lib/data/links'

/**
 * <RelatedLink href="/qualifier/eligibility" />: the title comes from the
 * target page, so links stay accurate when pages are renamed.
 */
export async function RelatedLink({
  href,
  title,
  children,
}: {
  href?: string
  title?: string
  children?: ReactNode
}) {
  if (!href || !href.startsWith('/')) return null
  const index = await getLinkIndex()
  const target = index[href.split('#')[0] ?? href]
  const label = children ?? title ?? target?.title ?? href

  return (
    <Link
      href={href}
      className="font-medium text-accent-ink underline decoration-accent-ink/30 underline-offset-4 hover:decoration-accent-ink"
      data-track-area="related"
    >
      {label}
    </Link>
  )
}
