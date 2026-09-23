import type { AuthorRef } from '@/lib/data/types'
import { formatDate } from '@/lib/utils/dates'

/** Author, reviewer and freshness — visible E-E-A-T signals. */
export function Byline({
  author,
  reviewer,
  updatedAt,
  reviewedAt,
}: {
  author?: AuthorRef | null
  reviewer?: AuthorRef | null
  updatedAt?: string | null
  reviewedAt?: string | null
}) {
  const parts: React.ReactNode[] = []
  if (author) parts.push(<span key="a">By <span className="font-medium text-text">{author.name}</span></span>)
  if (reviewer) parts.push(<span key="r">Reviewed by <span className="font-medium text-text">{reviewer.name}</span></span>)
  if (reviewedAt) {
    parts.push(
      <span key="rv">
        Last reviewed <time dateTime={reviewedAt}>{formatDate(reviewedAt)}</time>
      </span>,
    )
  } else if (updatedAt) {
    parts.push(
      <span key="u">
        Last updated <time dateTime={updatedAt}>{formatDate(updatedAt)}</time>
      </span>,
    )
  }
  if (parts.length === 0) return null
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-small text-muted">
      {parts.map((part, index) => (
        <span key={index} className="flex items-center gap-2">
          {index > 0 ? <span aria-hidden="true">·</span> : null}
          {part}
        </span>
      ))}
    </p>
  )
}
