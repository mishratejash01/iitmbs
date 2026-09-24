import Link from 'next/link'

import type { BlogPostSummary } from '@/lib/data/blog'
import { formatDate } from '@/lib/utils/dates'

/** Post teaser. The date shown is the last update, which is what readers care about. */
export function PostCard({
  post,
  headingLevel: Heading = 'h3',
}: {
  post: BlogPostSummary
  headingLevel?: 'h2' | 'h3'
}) {
  return (
    <Link
      href={post.path}
      className="group flex h-full flex-col border-t border-border pt-5 pb-2"
      data-track-area="blog_card"
    >
      <Heading className="text-[1.0625rem] leading-7 font-semibold text-text decoration-accent-ink/40 underline-offset-4 group-hover:text-accent-ink group-hover:underline">
        {post.title}
      </Heading>
      <p className="mt-auto pt-3 text-xs text-muted">
        {post.readingMinutes} min read ·{' '}
        <time dateTime={post.updatedAt}>{formatDate(post.updatedAt)}</time>
      </p>
    </Link>
  )
}

export function PostGrid({ posts, label }: { posts: BlogPostSummary[]; label: string }) {
  if (posts.length === 0) return null
  return (
    <ul aria-label={label} className="grid gap-x-10 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <li key={post.id}>
          <PostCard post={post} />
        </li>
      ))}
    </ul>
  )
}
