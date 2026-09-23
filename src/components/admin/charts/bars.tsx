import type { ReactNode } from 'react'

import { cn } from '@/lib/utils/cn'

import { formatValue, type ValueFormat } from './scale'

export type BarRow = { key: string; label: ReactNode; value: number; href?: string; note?: string }

/**
 * Ranked horizontal bars for one measure (top pages, sources, downloads).
 * Nominal categories share one hue; length carries the value, which is also
 * printed at the bar tip, so the list doubles as its own table view.
 */
export function BarList({
  title,
  rows,
  format = 'count',
  empty = 'No data for this period yet.',
  showShare = false,
  action,
}: {
  title: string
  rows: BarRow[]
  format?: ValueFormat
  empty?: string
  showShare?: boolean
  action?: ReactNode
}) {
  const max = Math.max(0, ...rows.map((r) => r.value))
  const total = rows.reduce((sum, r) => sum + r.value, 0)
  return (
    <section className="min-w-0 rounded-card border border-border bg-card p-4" aria-label={title}>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-small font-semibold text-text">{title}</h2>
        {action}
      </div>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-small text-muted">{empty}</p>
      ) : (
        <ol className="mt-3 space-y-2.5">
          {rows.map((row) => {
            const width = max > 0 ? Math.max(1.5, (row.value / max) * 100) : 0
            const value = `${formatValue(row.value, format)}${showShare && total > 0 ? ` · ${Math.round((row.value / total) * 100)}%` : ''}`
            const label = row.href ? (
              <a
                href={row.href}
                target="_blank"
                rel="noopener"
                className="hover:text-accent-ink hover:underline"
              >
                {row.label}
              </a>
            ) : (
              row.label
            )
            return (
              <li key={row.key} className="group">
                <div className="flex items-baseline justify-between gap-3 text-small">
                  <span
                    className="min-w-0 truncate text-text"
                    title={typeof row.label === 'string' ? row.label : undefined}
                  >
                    {label}
                  </span>
                  {row.note ? (
                    <span className="shrink-0 text-xs text-muted">{row.note}</span>
                  ) : null}
                </div>
                {/* The value rides the bar tip; the right margin reserves room for the longest. */}
                <div className="relative mt-1 mr-28 h-2.5">
                  <div
                    className="h-full rounded-r-[4px] bg-accent-strong transition-[filter] group-hover:brightness-110"
                    style={{ width: `${width}%` }}
                  />
                  <span
                    className="absolute top-1/2 ml-2 -translate-y-1/2 text-xs whitespace-nowrap text-text tabular-nums"
                    style={{ left: `${width}%` }}
                  >
                    {value}
                  </span>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}

/**
 * The student journey as an ordinal funnel: each step's bar is its share of
 * the first step, coloured on a one-hue ramp (validated light and dark) so
 * the order reads without relying on colour, with step-to-step conversion.
 */
export function Funnel({
  title,
  steps,
}: {
  title: string
  steps: Array<{ label: string; value: number }>
}) {
  const first = steps[0]?.value ?? 0
  return (
    <section className="min-w-0 rounded-card border border-border bg-card p-4" aria-label={title}>
      <h2 className="text-small font-semibold text-text">{title}</h2>
      {first === 0 ? (
        <p className="py-6 text-center text-small text-muted">No sessions in this period yet.</p>
      ) : (
        <ol className="mt-3 space-y-3">
          {steps.map((step, index) => {
            const share = first > 0 ? step.value / first : 0
            const previous = index > 0 ? steps[index - 1]!.value : null
            const conversion = previous ? step.value / previous : null
            return (
              <li key={step.label}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-small">
                  <span className="text-text">
                    <span className="mr-1.5 text-muted tabular-nums">{index + 1}.</span>
                    {step.label}
                  </span>
                  <span className="text-xs text-muted tabular-nums">
                    {formatValue(step.value)} · {Math.round(share * 100)}% of visits
                    {conversion !== null
                      ? ` · ${Math.round(conversion * 100)}% of step ${index}`
                      : ''}
                  </span>
                </div>
                <div className="mt-1 h-3">
                  <div
                    className="h-full rounded-r-[4px]"
                    style={{
                      width: `${Math.max(step.value > 0 ? 1.5 : 0, share * 100)}%`,
                      background: `var(--funnel-${index + 1})`,
                    }}
                  />
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}

/** A headline number with its change against the previous period. */
export function StatTile({
  label,
  value,
  previous,
  format = 'count',
  upIsGood = true,
  periodLabel,
  hint,
}: {
  label: string
  value: number
  previous?: number
  format?: ValueFormat
  upIsGood?: boolean
  periodLabel?: string
  hint?: string
}) {
  const change = previous !== undefined && previous > 0 ? (value - previous) / previous : null
  const direction =
    change === null || Math.abs(change) < 0.005 ? 'flat' : change > 0 ? 'up' : 'down'
  const good = direction === 'flat' ? null : (direction === 'up') === upIsGood
  return (
    <div className="rounded-card border border-border bg-card p-4">
      <p className="text-small text-muted">{label}</p>
      <p className="mt-1 text-h2 font-semibold text-text">{formatValue(value, format)}</p>
      <p
        className={cn(
          'mt-1 text-xs',
          good === null ? 'text-muted' : good ? 'text-success' : 'text-danger',
        )}
      >
        {change === null ? (
          (hint ?? (previous === 0 && value > 0 ? 'New this period' : '\u00a0'))
        ) : (
          <>
            <span aria-hidden="true">
              {direction === 'up' ? '▲' : direction === 'down' ? '▼' : '•'}
            </span>{' '}
            {direction === 'flat'
              ? 'No change'
              : `${change > 0 ? '+' : ''}${Math.round(change * 100)}%`}
            <span className="text-muted"> vs {periodLabel ?? 'previous period'}</span>
          </>
        )}
      </p>
    </div>
  )
}
