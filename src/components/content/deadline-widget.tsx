'use client'

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
    <section aria-labelledby="deadlines" className="rounded-panel bg-accent-soft p-6 sm:p-7">
      <h2 id="deadlines" className="text-h3 font-semibold text-accent-strong">
        Upcoming graded assignments
      </h2>
      <ul className="mt-3 divide-y divide-accent-strong/10">
        {visible.map((deadline) => (
          <li key={deadline.id}>
            <Link
              href={deadline.path}
              className="group flex items-baseline justify-between gap-3 py-3"
            >
              <span className="min-w-0">
                <span className="block text-small font-semibold text-text group-hover:underline">
                  {deadline.courseShortName} · Week {deadline.weekNumber}
                </span>
                <span className="block text-xs text-text/75">
                  Due {formatDateTime(deadline.dueAt)}
                </span>
              </span>
              <span
                className="shrink-0 text-xs font-semibold text-accent-strong"
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
