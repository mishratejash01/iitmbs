import type { ReactNode } from 'react'

import { cn } from '@/lib/utils/cn'

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: {
  title: string
  description?: ReactNode
  icon?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-card border border-dashed border-border-strong bg-surface px-6 py-10 text-center',
        className,
      )}
    >
      {icon ? (
        <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-accent-soft text-accent-ink" aria-hidden="true">
          {icon}
        </div>
      ) : null}
      <p className="font-semibold text-text">{title}</p>
      {description ? <div className="mt-1 max-w-md text-small text-muted">{description}</div> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
