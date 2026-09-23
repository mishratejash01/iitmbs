'use client'

import { CalendarClock } from 'lucide-react'
import Link from 'next/link'
import type { Deadline } from '@/lib/data/upcoming'
import { useNow } from '@/lib/hooks/browser-state'
import { formatDateTime, formatDuration } from '@/lib/utils/dates'

/**
 * Upcoming graded-assignment deadlines. Data is cached for an hour on the
 * server; the client drops deadlines that have passed and shows live
 * countdowns. The server-rendered list is shown until hydration.
 */
export function DeadlineWidget({
  deadlines,
  limit = 6,
}: {
  deadlines: Deadline[]
  limit?: number
}) {
  // Null until hydrated, so the server list and first client render match.
  const now = useNow(60_000)

  const visible = deadlines.filter((d) => now === null || Date.parse(d.dueAt) > now).slice(0, limit)
  if (visible.length === 0) return null

  return (
    <section
      aria-labelledby="deadlines"
      className="rounded-card border border-border bg-card p-4 sm:p-5"
    >
      <h2 id="deadlines" className="flex items-center gap-2 font-semibold text-text">
        <CalendarClock aria-hidden="true" className="size-5 text-accent-ink" />
        Upcoming graded assignments
      </h2>
      <ul className="mt-3 divide-y divide-border">
        {visible.map((deadline) => (
          <li key={deadline.id}>
            <Link
              href={deadline.path}
              className="flex items-center justify-between gap-3 py-3 hover:text-accent-ink"
            >
              <span className="min-w-0">
                <span className="block text-small font-medium text-text">
                  {deadline.courseShortName} · Week {deadline.weekNumber}
                </span>
                <span className="block text-xs text-muted">
                  Due {formatDateTime(deadline.dueAt)}
                </span>
              </span>
              <span
                className="shrink-0 rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent-ink"
                suppressHydrationWarning
              >
                {now === null
                  ? 'Due soon'
                  : `in ${formatDuration((Date.parse(deadline.dueAt) - now) / 1000)}`}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
