import Link from 'next/link'

import type { BlogPostSummary } from '@/lib/data/blog'

import { PostCover } from './post-cover'

/** "More from <topic>": a few posts from the same topic, placed inside the article. */
export function MoreFrom({
  title,
  href,
  posts,
}: {
  title: string
  href: string
  posts: BlogPostSummary[]
}) {
  if (posts.length === 0) return null
  return (
    <aside aria-labelledby="more-from" className="my-10 bg-surface p-5 sm:p-6" data-print="hide">
      <div className="flex items-baseline justify-between gap-4 border-b-2 border-accent-strong pb-2">
        <h2 id="more-from" className="text-small font-bold tracking-[0.08em] text-text uppercase">
          {title}
        </h2>
        <Link href={href} className="text-small font-medium text-accent-ink hover:underline">
          See all
        </Link>
      </div>
      <ul className="mt-4 grid gap-4 sm:grid-cols-3">
        {posts.map((post) => (
          <li key={post.id}>
            <Link
              href={post.path}
              className="group flex gap-3 sm:flex-col"
              data-track-area="more_from"
            >
              <PostCover post={post} size="thumb" className="w-28 shrink-0 sm:w-full" />
              <span className="line-clamp-3 text-[0.9375rem] leading-snug font-medium text-text group-hover:text-accent-ink">
                {post.title}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  )
}
