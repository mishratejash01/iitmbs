import Link from 'next/link'

import { cn } from '@/lib/utils/cn'

export type Topic = { path: string; name: string }

const VARIANTS = {
  // Outlined, for the blog index's popular topics.
  outline:
    'min-h-10 border border-border-strong bg-card px-4 text-small text-text hover:border-accent-ink hover:text-accent-ink sm:px-5',
  // Filled and small, for sidebars.
  soft: 'min-h-10 bg-surface px-3.5 sm:min-h-8 text-xs text-text hover:bg-accent-soft hover:text-accent-ink',
} as const

/** Blog topics as pills, each linking to the topic's full list. */
export function TopicPills({
  topics,
  label,
  variant = 'outline',
  className,
}: {
  topics: Topic[]
  label: string
  variant?: keyof typeof VARIANTS
  className?: string
}) {
  if (topics.length === 0) return null
  return (
    <ul aria-label={label} className={cn('flex flex-wrap gap-2 sm:gap-3', className)}>
      {topics.map((topic) => (
        <li key={topic.path}>
          <Link
            href={topic.path}
            className={cn(
              'inline-flex items-center rounded-full transition-colors',
              VARIANTS[variant],
            )}
            data-track-area="topic"
          >
            {topic.name}
          </Link>
        </li>
      ))}
    </ul>
  )
}
