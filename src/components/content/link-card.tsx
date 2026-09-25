import { FileText, Globe } from 'lucide-react'
import Link from 'next/link'

import { LogoMark } from '@/components/layout/logo'
import { cn } from '@/lib/utils/cn'

/**
 * A link shown as a preview card: a mark for the site it goes to, the title
 * and the site's address. Nothing is fetched from the other site; the mark
 * is drawn here (IITM for official pages, a document for Google Docs and
 * Drive, the site's initial otherwise).
 */
export function LinkCard({
  href,
  title,
  host,
  summary,
  official = false,
  internal = false,
  className,
}: {
  href: string
  title: string
  host: string
  summary?: string | null
  official?: boolean
  internal?: boolean
  className?: string
}) {
  const document = host === 'docs.google.com' || host === 'drive.google.com'
  const classes = cn(
    'group flex h-full items-start gap-3.5 rounded-card border border-border bg-card p-4 transition-colors hover:border-accent-ink/50',
    className,
  )
  const body = (
    <>
      <span
        aria-hidden="true"
        className="flex size-11 shrink-0 items-center justify-center rounded-control bg-surface text-accent-strong"
      >
        {internal ? (
          <LogoMark className="size-7" />
        ) : official ? (
          <span className="text-[0.6875rem] font-bold tracking-wide">IITM</span>
        ) : document ? (
          <FileText className="size-5" />
        ) : (
          <Globe className="size-5" />
        )}
      </span>
      <span className="min-w-0">
        <span className="block leading-snug font-medium text-text group-hover:text-accent-ink group-hover:underline">
          {title}
        </span>
        {summary ? (
          <span className="mt-1 line-clamp-2 block text-small leading-snug text-muted">
            {summary}
          </span>
        ) : null}
        <span className="mt-1 block truncate text-xs text-muted">
          {official ? `IIT Madras · ${host}` : host}
        </span>
      </span>
    </>
  )
  // data-card keeps article link styles (underline, colour) off the card.
  return internal ? (
    <Link href={href} className={classes} data-card data-track-area="link_card">
      {body}
    </Link>
  ) : (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={classes}
      data-card
      data-track-area="link_card"
    >
      {body}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  )
}
