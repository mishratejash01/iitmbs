import Link from 'next/link'
import type { ReactNode } from 'react'

import { Badge, type BadgeTone } from '@/components/ui/badge'
import type { RecordStatus } from '@/lib/admin/records'
import { cn } from '@/lib/utils/cn'

export function AdminHeader({
  title,
  description,
  actions,
  back,
}: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  back?: { href: string; label: string }
}) {
  return (
    <div className="mb-6">
      {back ? (
        <Link
          href={back.href}
          className="inline-flex min-h-9 items-center text-small text-muted hover:text-text"
        >
          ← {back.label}
        </Link>
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-h2 font-semibold tracking-tight text-text">{title}</h1>
          {description ? (
            <div className="mt-1 max-w-3xl text-small text-muted">{description}</div>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  )
}

const STATUS: Record<RecordStatus, { label: string; tone: BadgeTone }> = {
  live: { label: 'Live', tone: 'success' },
  scheduled: { label: 'Scheduled', tone: 'accent' },
  draft: { label: 'Draft', tone: 'neutral' },
  deleted: { label: 'Deleted', tone: 'danger' },
}

export function StatusBadge({ status }: { status: RecordStatus | undefined }) {
  if (!status) return null
  return <Badge tone={STATUS[status].tone}>{STATUS[status].label}</Badge>
}

export function StatCard({
  label,
  value,
  hint,
  href,
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  href?: string
}) {
  const body = (
    <>
      <p className="text-small text-muted">{label}</p>
      <p className="mt-1 text-h2 font-semibold text-text tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </>
  )
  const className = 'block rounded-card border border-border bg-card p-4'
  return href ? (
    <Link href={href} className={cn(className, 'transition-colors hover:border-accent')}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  )
}

export function Panel({
  title,
  actions,
  children,
  className,
}: {
  title?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('min-w-0 rounded-card border border-border bg-card', className)}>
      {title || actions ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
          {title ? <h2 className="font-semibold text-text">{title}</h2> : <span />}
          {actions}
        </div>
      ) : null}
      <div className="p-4">{children}</div>
    </section>
  )
}

/** Scrollable table wrapper with consistent cell styles. */
export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('overflow-x-auto rounded-card border border-border bg-card', className)}>
      <table className="w-full text-left text-small [&_td]:border-t [&_td]:border-border [&_td]:px-3 [&_td]:py-2.5 [&_td]:align-top [&_th]:bg-surface [&_th]:px-3 [&_th]:py-2 [&_th]:text-xs [&_th]:font-semibold [&_th]:whitespace-nowrap [&_th]:text-muted">
        {children}
      </table>
    </div>
  )
}

export function Notice({
  tone = 'success',
  children,
}: {
  tone?: 'success' | 'warning' | 'danger' | 'info'
  children: ReactNode
}) {
  const tones = {
    success: 'border-success/30 bg-success-soft text-success',
    warning: 'border-warning/30 bg-warning-soft text-warning',
    danger: 'border-danger/30 bg-danger-soft text-danger',
    info: 'border-border bg-surface text-text',
  }
  return (
    <div
      role="status"
      className={cn('mb-4 rounded-control border px-4 py-3 text-small', tones[tone])}
    >
      {children}
    </div>
  )
}

export const inputClasses =
  'min-h-11 w-full rounded-control border border-border-strong bg-card px-3 text-text placeholder:text-muted focus-visible:border-accent sm:min-h-10'
