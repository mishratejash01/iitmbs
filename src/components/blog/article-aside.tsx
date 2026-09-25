import { ArrowRight, FileText, MonitorPlay, NotebookPen } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

import type { BlogPostSummary } from '@/lib/data/blog'
import { cn } from '@/lib/utils/cn'
import { formatDate } from '@/lib/utils/dates'

import { PostCover } from './post-cover'
import { PromoBanners } from './promo-banners'
import { type Topic, TopicPills } from './topic-pills'

export type CourseResource = {
  href: string
  kind: 'papers' | 'notes' | 'lectures'
  title: string
}

const KIND_LABEL: Record<CourseResource['kind'], string> = {
  papers: 'Previous year papers',
  notes: 'Student notes',
  lectures: 'Official lectures',
}

const KIND_ICON = { papers: FileText, notes: NotebookPen, lectures: MonitorPlay } as const
const KIND_TONE = { papers: 'bg-violet', notes: 'bg-lime', lectures: 'bg-sky' } as const

/** One "Recommended for you" row: a square thumbnail, the title, then a short line. */
function Row({
  href,
  thumb,
  title,
  meta,
}: {
  href: string
  thumb: ReactNode
  title: string
  meta: ReactNode
}) {
  return (
    <Link
      href={href}
      className="group flex gap-3.5 border-b border-border py-3.5"
      data-track-area="recommended"
    >
      <span className="size-[5.5rem] shrink-0 overflow-hidden border border-border">{thumb}</span>
      <span className="min-w-0 self-center">
        <span className="line-clamp-2 text-base leading-6 text-text group-hover:text-accent-ink">
          {title}
        </span>
        <span className="mt-1 block text-small">{meta}</span>
      </span>
    </Link>
  )
}

/**
 * The article sidebar, in the store-blog pattern: "Recommended for you" (the
 * course's papers and notes, then the editors' picks), promotional banners
 * for the site's own sections, then every topic. Below the article on phones.
 */
export function ArticleAside({
  resources,
  recommended,
  topics,
  seeAllHref,
  siteName,
  className,
}: {
  resources: CourseResource[]
  recommended: BlogPostSummary[]
  topics: Topic[]
  seeAllHref: string
  siteName: string
  className?: string
}) {
  return (
    <div className={cn('space-y-10', className)}>
      {resources.length > 0 || recommended.length > 0 ? (
        <section aria-labelledby="recommended">
          <div className="flex items-center justify-between gap-4">
            <h2 id="recommended" className="text-[1.125rem] font-semibold text-text">
              Recommended for you
            </h2>
            <Link
              href={seeAllHref}
              className="group inline-flex min-h-10 items-center gap-1 text-base font-medium text-accent-ink"
            >
              See all
              <ArrowRight
                aria-hidden="true"
                className="size-4 transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          </div>
          <ul>
            {resources.map((resource) => {
              const Icon = KIND_ICON[resource.kind]
              return (
                <li key={resource.href}>
                  <Row
                    href={resource.href}
                    title={resource.title}
                    thumb={
                      <span
                        className={cn(
                          'flex size-full items-center justify-center text-accent-strong',
                          KIND_TONE[resource.kind],
                        )}
                      >
                        <Icon aria-hidden="true" className="size-8" strokeWidth={1.5} />
                      </span>
                    }
                    meta={
                      <>
                        <span className="font-semibold text-success">Free</span>
                        <span className="text-muted"> · {KIND_LABEL[resource.kind]}</span>
                      </>
                    }
                  />
                </li>
              )
            })}
            {recommended.map((post) => (
              <li key={post.id}>
                <Row
                  href={post.path}
                  title={post.title}
                  thumb={<PostCover post={post} size="thumb" className="size-full" />}
                  meta={
                    <span className="text-muted">
                      <time dateTime={post.updatedAt}>{formatDate(post.updatedAt)}</time>
                    </span>
                  }
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <PromoBanners siteName={siteName} />

      {topics.length > 0 ? (
        <nav aria-labelledby="discover-more">
          <h2 id="discover-more" className="mb-3 text-[1.125rem] font-semibold text-text">
            Discover more
          </h2>
          <TopicPills
            topics={topics}
            label="Blog topics"
            variant="soft"
            className="gap-2 sm:gap-2"
          />
        </nav>
      ) : null}
    </div>
  )
}
