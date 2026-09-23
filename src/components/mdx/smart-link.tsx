import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import type { AnchorHTMLAttributes } from 'react'

/**
 * Internal links use client-side navigation; external links open in a new
 * tab with rel=noopener and are tracked as outbound by the analytics
 * delegate (it detects the different origin).
 */
export function SmartLink({
  href = '',
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (href.startsWith('/') || href.startsWith('#')) {
    return (
      <Link href={href} {...props}>
        {children}
      </Link>
    )
  }
  const safe = /^(https?:|mailto:)/i.test(href) ? href : '#'
  return (
    <a href={safe} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
      <ExternalLink aria-hidden="true" className="ml-0.5 inline size-3.5 align-[-2px]" />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  )
}
