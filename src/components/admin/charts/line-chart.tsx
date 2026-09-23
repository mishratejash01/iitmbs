'use client'

import { useCallback, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'

import { cn } from '@/lib/utils/cn'

import { formatAxisDay, formatValue, niceTicks, type ValueFormat } from './scale'

type Point = { day: string; value: number }

const HEIGHT = 168
const PAD = { top: 16, right: 44, bottom: 26, left: 44 }

/**
 * One series over time: a 2px line over a 10% wash, recessive hairline grid,
 * the latest value labelled at the end, and a crosshair that snaps to the
 * nearest day (pointer or arrow keys). A table view carries every value.
 */
export function LineChart({
  title,
  data,
  format = 'count',
  className,
}: {
  title: string
  data: Point[]
  format?: ValueFormat
  className?: string
}) {
  const id = useId()
  const frame = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(560)
  const [active, setActive] = useState<number | null>(null)

  // Measure the container; the chart redraws at its real width. The returned
  // cleanup (React 19 ref callbacks) disconnects the observer on unmount.
  const attach = useCallback((node: HTMLDivElement | null) => {
    frame.current = node
    if (!node || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.max(240, Math.round(entry.contentRect.width)))
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const values = data.map((d) => d.value)
  const ticks = niceTicks(Math.max(0, ...values))
  const top = ticks[ticks.length - 1] || 1
  const plotW = width - PAD.left - PAD.right
  const plotH = HEIGHT - PAD.top - PAD.bottom
  const x = (i: number) =>
    PAD.left + (data.length <= 1 ? plotW / 2 : (i / (data.length - 1)) * plotW)
  const y = (v: number) => PAD.top + plotH - (v / top) * plotH

  const line = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`)
    .join('')
  const area = data.length
    ? `${line}L${x(data.length - 1).toFixed(1)},${y(0)}L${x(0).toFixed(1)},${y(0)}Z`
    : ''
  const last = data.length - 1
  const labelIndexes = data.length > 2 ? [0, Math.floor(last / 2), last] : data.map((_, i) => i)
  const total = values.reduce((sum, v) => sum + v, 0)

  const nearest = (clientX: number) => {
    const rect = frame.current?.getBoundingClientRect()
    if (!rect || data.length === 0) return null
    const ratio = (clientX - rect.left - PAD.left) / plotW
    return Math.min(last, Math.max(0, Math.round(ratio * last)))
  }
  const onPointerMove = (event: PointerEvent) => setActive(nearest(event.clientX))
  const onKeyDown = (event: KeyboardEvent) => {
    if (
      event.key !== 'ArrowLeft' &&
      event.key !== 'ArrowRight' &&
      event.key !== 'Home' &&
      event.key !== 'End'
    )
      return
    event.preventDefault()
    const current = active ?? last
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? last
          : current + (event.key === 'ArrowRight' ? 1 : -1)
    setActive(Math.min(last, Math.max(0, next)))
  }

  const point = active !== null ? data[active] : undefined
  // The tooltip sits beside the crosshair, never on top of the point it describes.
  const tooltipOnRight = active !== null && x(active) < width / 2
  const tooltipLeft = active !== null ? x(active) + (tooltipOnRight ? 10 : -10) : 0

  return (
    <figure
      className={cn('min-w-0 rounded-card border border-border bg-card p-4', className)}
      aria-labelledby={`${id}-title`}
    >
      <figcaption className="flex items-baseline justify-between gap-2">
        <span id={`${id}-title`} className="text-small font-semibold text-text">
          {title}
        </span>
        <span className="text-small text-muted">{formatValue(total, format)} total</span>
      </figcaption>

      {data.length === 0 ? (
        <p className="py-10 text-center text-small text-muted">No data for this period yet.</p>
      ) : (
        <div
          ref={attach}
          className="relative mt-2 touch-pan-y outline-none focus-visible:ring-2 focus-visible:ring-focus"
          tabIndex={0}
          role="group"
          aria-label={`${title} by day. Use the left and right arrow keys to read each day.`}
          onPointerMove={onPointerMove}
          onPointerLeave={() => setActive(null)}
          onFocus={() => setActive((a) => a ?? last)}
          onBlur={() => setActive(null)}
          onKeyDown={onKeyDown}
        >
          <svg
            width={width}
            height={HEIGHT}
            viewBox={`0 0 ${width} ${HEIGHT}`}
            className="block max-w-full"
            aria-hidden="true"
          >
            {ticks.map((tick) => (
              <g key={tick}>
                <line
                  x1={PAD.left}
                  x2={width - PAD.right}
                  y1={y(tick)}
                  y2={y(tick)}
                  stroke="var(--border)"
                  strokeWidth={1}
                />
                <text
                  x={PAD.left - 8}
                  y={y(tick)}
                  dy="0.32em"
                  textAnchor="end"
                  className="fill-muted text-[11px] tabular-nums"
                >
                  {formatValue(tick, format, true)}
                </text>
              </g>
            ))}
            {labelIndexes.map((i) => (
              <text
                key={i}
                x={x(i)}
                y={HEIGHT - 6}
                textAnchor={i === 0 ? 'start' : i === last ? 'end' : 'middle'}
                className="fill-muted text-[11px]"
              >
                {formatAxisDay(data[i]!.day)}
              </text>
            ))}
            <path d={area} fill="var(--accent-strong)" fillOpacity={0.1} />
            <path
              d={line}
              fill="none"
              stroke="var(--accent-strong)"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {active !== null ? (
              <line
                x1={x(active)}
                x2={x(active)}
                y1={PAD.top}
                y2={PAD.top + plotH}
                stroke="var(--text-muted)"
                strokeWidth={1}
              />
            ) : null}
            {(() => {
              const i = active ?? last
              return (
                <circle
                  cx={x(i)}
                  cy={y(data[i]!.value)}
                  r={4}
                  fill="var(--accent-strong)"
                  stroke="var(--card)"
                  strokeWidth={2}
                />
              )
            })()}
            <text
              x={x(last) + 8}
              y={y(data[last]!.value)}
              dy="0.32em"
              className="fill-text text-[12px] font-semibold"
            >
              {formatValue(data[last]!.value, format, true)}
            </text>
          </svg>

          {point ? (
            <div
              role="status"
              className={cn(
                'pointer-events-none absolute top-1 z-10 rounded-control border border-border bg-card px-2.5 py-1.5 text-xs whitespace-nowrap shadow-card',
                !tooltipOnRight && '-translate-x-full',
              )}
              style={{ left: tooltipLeft }}
            >
              <p className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="inline-block h-0.5 w-3 rounded bg-accent-strong"
                />
                <strong className="text-small font-semibold text-text">
                  {formatValue(point.value, format)}
                </strong>
              </p>
              <p className="text-muted">{formatAxisDay(point.day, true)}</p>
            </div>
          ) : null}
        </div>
      )}

      {data.length ? (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs text-muted hover:text-text">
            Show as table
          </summary>
          <div className="mt-2 max-h-64 overflow-y-auto">
            <table className="w-full text-xs">
              <caption className="sr-only">{title} by day</caption>
              <thead>
                <tr className="text-left text-muted">
                  <th scope="col" className="py-1 font-medium">
                    Day
                  </th>
                  <th scope="col" className="py-1 text-right font-medium">
                    {title}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((d) => (
                  <tr key={d.day} className="border-t border-border">
                    <td className="py-1 text-text">{formatAxisDay(d.day, true)}</td>
                    <td className="py-1 text-right text-text tabular-nums">
                      {formatValue(d.value, format)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ) : null}
    </figure>
  )
}
