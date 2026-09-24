'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { track } from '@/lib/analytics/client'
import { useNow } from '@/lib/hooks/browser-state'
import { formatDateTime, formatDuration } from '@/lib/utils/dates'

/** A release date this far out means "not scheduled yet". */
const UNSCHEDULED_YEAR = 2090

/**
 * Shown while worked solutions are locked. The lock itself is enforced by
 * Postgres; this only explains it, counts down, and refreshes the page once
 * the release time passes so the walkthroughs appear without a reload.
 */
export function SolutionGate({
  assignmentId,
  releaseAt,
}: {
  assignmentId: string
  releaseAt: string
}) {
  const router = useRouter()
  const releaseMs = Date.parse(releaseAt)
  const scheduled = new Date(releaseAt).getUTCFullYear() < UNSCHEDULED_YEAR
  // Null until hydrated, so the server HTML and the first client render match.
  const now = useNow(1000)
  const [attempts, setAttempts] = useState(0)
  const reported = useRef(false)

  useEffect(() => {
    if (now === null || reported.current) return
    reported.current = true
    track('solution_gate_seen', {
      assignment_id: assignmentId,
      seconds_until_release: scheduled ? Math.max(0, Math.round((releaseMs - now) / 1000)) : null,
    })
  }, [now, assignmentId, releaseMs, scheduled])

  const released = scheduled && now !== null && now >= releaseMs

  // Once released, refresh (with back-off) until the server sends walkthroughs.
  useEffect(() => {
    if (!released || attempts >= 6) return
    const timer = setTimeout(
      () => {
        router.refresh()
        setAttempts((a) => a + 1)
      },
      attempts === 0 ? 2000 : 10000,
    )
    return () => clearTimeout(timer)
  }, [released, attempts, router])

  return (
    <section
      aria-labelledby="solution-gate"
      data-solution-gate=""
      className="rounded-panel bg-accent-soft p-5 sm:p-6"
    >
      <h2 id="solution-gate" className="font-semibold text-text">
        {released ? 'Walkthroughs are unlocking…' : 'Worked solutions unlock after the deadline'}
      </h2>
      {released ? (
        <div className="mt-2 flex flex-wrap items-center gap-3 text-small text-text">
          <span role="status">Fetching the walkthroughs now.</span>
          <Button variant="secondary" size="sm" onClick={() => router.refresh()}>
            Refresh
          </Button>
        </div>
      ) : (
        <p className="mt-1 text-small text-text">
          {scheduled ? (
            <>
              Unlocks <time dateTime={releaseAt}>{formatDateTime(releaseAt)}</time>
              {now !== null ? (
                <span className="font-medium" suppressHydrationWarning>
                  , in {formatDuration((releaseMs - now) / 1000)}
                </span>
              ) : null}
              .
            </>
          ) : (
            'The release time will be set once the official deadline is confirmed.'
          )}{' '}
          Until then, work through the concepts and hints below. They are designed to get you
          unstuck without giving the answer away.
        </p>
      )}
    </section>
  )
}
