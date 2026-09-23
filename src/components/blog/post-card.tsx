import { LinkCard } from '@/components/ui/card'
import type { BlogPostSummary } from '@/lib/data/blog'
import { formatDate } from '@/lib/utils/dates'

/** Post teaser. The date shown is the last update, which is what readers care about. */
export function PostCard({
  post,
  headingLevel: Heading = 'h3',
  showCategory = true,
}: {
  post: BlogPostSummary
  headingLevel?: 'h2' | 'h3'
  showCategory?: boolean
}) {
  return (
    <LinkCard href={post.path} className="flex h-full flex-col" data-track-area="blog_card">
      {showCategory ? (
        <p className="text-xs font-medium text-accent-ink">{post.category.name}</p>
      ) : null}
      <Heading className="mt-1 font-semibold text-text group-hover:text-accent-ink">
        {post.title}
      </Heading>
      {post.summary ? (
        <p className="mt-2 line-clamp-3 text-small text-muted">{post.summary}</p>
      ) : null}
      <p className="mt-auto pt-3 text-xs text-muted">
        {post.readingMinutes} min read ·{' '}
        <time dateTime={post.updatedAt}>{formatDate(post.updatedAt)}</time>
      </p>
    </LinkCard>
  )
}

export function PostGrid({
  posts,
  label,
  showCategory = true,
}: {
  posts: BlogPostSummary[]
  label: string
  showCategory?: boolean
}) {
  if (posts.length === 0) return null
  return (
    <ul aria-label={label} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <li key={post.id}>
          <PostCard post={post} showCategory={showCategory} />
        </li>
      ))}
    </ul>
  )
}
