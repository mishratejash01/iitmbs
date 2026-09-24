import type { ReactNode } from 'react'

import { cn } from '@/lib/utils/cn'

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-panel bg-surface px-6 py-12 text-center',
        className,
      )}
    >
      <p className="font-semibold text-text">{title}</p>
      {description ? (
        <div className="mt-1 max-w-md text-small text-muted">{description}</div>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
