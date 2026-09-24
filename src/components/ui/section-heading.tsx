import Link from 'next/link'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils/cn'

export function SectionHeading({
  id,
  title,
  action,
  as: Tag = 'h2',
  className,
}: {
  id?: string
  title: ReactNode
  action?: { href: string; label: string }
  as?: 'h2' | 'h3'
  className?: string
}) {
  return (
    <div className={cn('mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-1', className)}>
      <div>
        <Tag
          id={id}
          className={cn(
            'font-semibold text-text',
            Tag === 'h2' ? 'text-[1.375rem] leading-8 sm:text-h2' : 'text-h3',
          )}
        >
          {title}
        </Tag>
      </div>
      {action ? (
        <Link
          href={action.href}
          className="text-small font-semibold text-accent-ink underline decoration-accent-ink/30 underline-offset-4 hover:decoration-accent-ink"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  )
}
