import { ArrowRight, CheckCircle2, CircleDashed } from 'lucide-react'
import Link from 'next/link'

import type { WeekSummary } from '@/lib/data/types'

function Status({ ok, label }: { ok: boolean; label: string }) {
  const Icon = ok ? CheckCircle2 : CircleDashed
  return (
    <span className={ok ? 'inline-flex items-center gap-1 text-success' : 'inline-flex items-center gap-1 text-muted'}>
      <Icon aria-hidden="true" className="size-3.5" />
      {label}
      <span className="sr-only">{ok ? ' available' : ' coming soon'}</span>
    </span>
  )
}

export function WeekGrid({ weeks, headingLevel = 'h3' }: { weeks: WeekSummary[]; headingLevel?: 'h2' | 'h3' }) {
  const Heading = headingLevel
  return (
    <ol className="grid gap-4 sm:grid-cols-2">
      {weeks.map((week) => (
        <li key={week.id}>
          <Link
            href={week.path}
            className="group flex h-full flex-col rounded-card border border-border bg-card p-4 hover:border-accent sm:p-5"
            data-track-area="week-grid"
          >
            <span className="text-small font-medium text-accent-ink">Week {week.number}</span>
            <Heading className="mt-0.5 font-semibold text-text group-hover:text-accent-ink">{week.title}</Heading>
            {week.topics.length > 0 ? (
              <p className="mt-2 line-clamp-2 text-small text-muted">{week.topics.join(' · ')}</p>
            ) : null}
            <span className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-4 text-xs">
              <Status ok={week.hasNotes} label="Notes" />
              <Status ok={week.hasGraded} label="Graded assignment" />
              <Status ok={week.hasPractice} label="Practice" />
              <ArrowRight aria-hidden="true" className="ml-auto size-4 text-accent-ink transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        </li>
      ))}
    </ol>
  )
}
