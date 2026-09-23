import { ArrowLeft, ArrowRight } from 'lucide-react'
import Link from 'next/link'

type Target = { href: string; label: string; title?: string } | null

export function PrevNext({ previous, next }: { previous: Target; next: Target }) {
  if (!previous && !next) return null
  return (
    <nav aria-label="Previous and next" className="mt-10 grid gap-3 sm:grid-cols-2" data-print="hide">
      {previous ? (
        <Link href={previous.href} className="group rounded-card border border-border p-4 hover:border-accent" data-track-area="prev-next">
          <span className="flex items-center gap-1 text-small text-muted">
            <ArrowLeft aria-hidden="true" className="size-4" /> {previous.label}
          </span>
          {previous.title ? <span className="mt-1 block font-medium text-text group-hover:text-accent-ink">{previous.title}</span> : null}
        </Link>
      ) : (
        <span className="hidden sm:block" />
      )}
      {next ? (
        <Link
          href={next.href}
          className="group rounded-card border border-border p-4 text-right hover:border-accent"
          data-track-area="prev-next"
        >
          <span className="flex items-center justify-end gap-1 text-small text-muted">
            {next.label} <ArrowRight aria-hidden="true" className="size-4" />
          </span>
          {next.title ? <span className="mt-1 block font-medium text-text group-hover:text-accent-ink">{next.title}</span> : null}
        </Link>
      ) : null}
    </nav>
  )
}
