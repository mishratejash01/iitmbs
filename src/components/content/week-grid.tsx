import Link from 'next/link'

import type { WeekSummary } from '@/lib/data/types'

/** "Notes, graded assignment and practice" from what a week has so far. */
function readyLine(week: WeekSummary): string {
  const ready = [
    week.hasNotes ? 'notes' : null,
    week.hasGraded ? 'graded assignment' : null,
    week.hasPractice ? 'practice' : null,
  ].filter((item): item is string => item !== null)
  if (ready.length === 0) return 'Coming soon'
  const list = ready.length > 1 ? `${ready.slice(0, -1).join(', ')} and ${ready.at(-1)}` : ready[0]
  return `Ready: ${list}`
}

/** The weeks of a course as a numbered list between hairlines. */
export function WeekGrid({
  weeks,
  headingLevel = 'h3',
}: {
  weeks: WeekSummary[]
  headingLevel?: 'h2' | 'h3'
}) {
  const Heading = headingLevel
  return (
    <ol className="border-t border-border">
      {weeks.map((week) => (
        <li key={week.id} className="border-b border-border">
          <Link
            href={week.path}
            className="group grid gap-x-8 gap-y-1 py-5 sm:grid-cols-[6.5rem_1fr]"
            data-track-area="week-grid"
          >
            <span className="text-small font-semibold text-accent-ink">Week {week.number}</span>
            <span className="min-w-0">
              <Heading className="text-h3 font-semibold text-text decoration-accent-ink/40 underline-offset-4 group-hover:text-accent-ink group-hover:underline">
                {week.title}
              </Heading>
              {week.topics.length > 0 ? (
                <span className="mt-1 line-clamp-2 block text-small text-muted">
                  {week.topics.join(' · ')}
                </span>
              ) : null}
              <span className="mt-2 block text-xs font-medium text-accent-ink">
                {readyLine(week)}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ol>
  )
}
