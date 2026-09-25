import Link from 'next/link'

import type { BlogPostSummary } from '@/lib/data/blog'
import { formatDate } from '@/lib/utils/dates'

import { PostCover } from './post-cover'

/**
 * Post teaser: banner, an optional topic tag, the title and when it was last
 * updated (what readers care about). `showTopic` is off inside a topic's own
 * section, where the tag would only repeat the heading.
 */
export function PostCard({
  post,
  headingLevel: Heading = 'h3',
  showTopic = true,
}: {
  post: BlogPostSummary
  headingLevel?: 'h2' | 'h3'
  showTopic?: boolean
}) {
  const tag = showTopic ? post.category.name : post.program?.shortName
  return (
    <Link href={post.path} className="group flex h-full flex-col" data-track-area="blog_card">
      <PostCover post={post} className="transition-opacity group-hover:opacity-90" />
      {tag ? (
        <p className="mt-3">
          <span className="inline-block rounded-[min(4px,var(--radius-control))] bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent-ink">
            {tag}
          </span>
        </p>
      ) : null}
      <Heading
        className={`${tag ? 'mt-1.5' : 'mt-3'} text-base leading-6 font-medium text-text group-hover:text-accent-ink`}
      >
        {post.title}
      </Heading>
      <p className="mt-auto pt-1.5 text-small text-muted">
        <time dateTime={post.updatedAt}>{formatDate(post.updatedAt)}</time>
        <span> · {post.readingMinutes} min read</span>
      </p>
    </Link>
  )
}

export function PostGrid({
  posts,
  label,
  showTopic = true,
}: {
  posts: BlogPostSummary[]
  label: string
  showTopic?: boolean
}) {
  if (posts.length === 0) return null
  return (
    <ul aria-label={label} className="grid gap-x-4 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <li key={post.id}>
          <PostCard post={post} showTopic={showTopic} />
        </li>
      ))}
    </ul>
  )
}

/** A compact row for sidebars: small banner, title and date. */
export function PostRow({ post }: { post: BlogPostSummary }) {
  return (
    <Link
      href={post.path}
      className="group -mx-2 flex gap-3 rounded-control p-2 hover:bg-surface"
      data-track-area="blog_row"
    >
      <PostCover post={post} size="thumb" className="w-24 shrink-0" />
      <span className="min-w-0">
        <span className="line-clamp-2 text-small leading-5 font-medium text-text group-hover:text-accent-ink">
          {post.title}
        </span>
        <span className="mt-1 block text-xs text-muted">
          <time dateTime={post.updatedAt}>{formatDate(post.updatedAt)}</time>
        </span>
      </span>
    </Link>
  )
}
