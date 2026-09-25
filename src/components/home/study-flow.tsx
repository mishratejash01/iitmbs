import { ArrowDown, BookOpen, CheckCircle2, Lightbulb } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils/cn'

const CHIP_TONES = ['bg-lime', 'bg-violet', 'bg-sky', 'bg-sun', 'bg-green'] as const
// Staggered so the stack reads as a loose pile of course files.
const CHIP_OFFSETS = ['ml-0', 'ml-10', 'ml-4', 'ml-14', 'ml-2'] as const

function Caption({
  step,
  className,
  children,
}: {
  step: number
  className?: string
  children: ReactNode
}) {
  return (
    <p
      className={cn(
        'mx-auto flex w-full max-w-64 items-start gap-2.5 rounded-card bg-card px-4 py-3 text-left text-small text-text shadow-card',
        className,
      )}
    >
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-accent-strong">
        {step}
      </span>
      {children}
    </p>
  )
}

/**
 * "How it works" for a graded-assignment week: pick a course, learn with
 * hints before the deadline, then read the walkthrough. On wide screens the
 * course files fan into the centre with curved lines; on phones the steps
 * stack. The drawing is decorative; the captions carry the meaning.
 */
export function StudyFlow({ courses }: { courses: string[] }) {
  const chips = (courses.length > 0 ? courses : ['Week 1', 'Week 2', 'Week 3', 'Week 4']).slice(
    0,
    5,
  )

  return (
    <ol className="grid gap-10 lg:grid-cols-[1fr_auto_1fr] lg:grid-rows-[1fr_auto] lg:gap-x-0 lg:gap-y-8">
      <li className="flex flex-col gap-8 lg:row-span-2 lg:grid lg:grid-rows-subgrid">
        <div
          aria-hidden="true"
          className="flex flex-1 flex-col justify-around self-center lg:self-stretch lg:justify-self-end"
        >
          {chips.map((name, index) => (
            <span
              key={name}
              className={cn(
                'relative z-10 my-1.5 flex w-44 items-center gap-3 rounded-card bg-card px-3 py-2.5 text-small font-medium text-text shadow-card',
                CHIP_OFFSETS[index % CHIP_OFFSETS.length],
              )}
            >
              <span
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-control text-accent-strong',
                  CHIP_TONES[index % CHIP_TONES.length],
                )}
              >
                <BookOpen className="size-4" />
              </span>
              <span className="truncate">{name}</span>
            </span>
          ))}
        </div>
        <Caption step={1} className="lg:mr-0">
          Pick your course and the week you are on
        </Caption>
      </li>

      <li className="flex flex-col gap-8 lg:row-span-2 lg:grid lg:grid-rows-subgrid">
        <div aria-hidden="true" className="flex flex-1 flex-col items-center lg:flex-row">
          <ArrowDown className="mb-6 size-6 text-accent-ink lg:hidden" />
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="-ml-14 hidden h-full w-44 self-stretch text-violet lg:block xl:w-52"
          >
            {chips.map((name, index) => {
              const y = ((index + 0.5) / chips.length) * 100
              return (
                <path
                  key={name}
                  d={`M0 ${y}C55 ${y} 45 50 100 50`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              )
            })}
          </svg>
          <span className="flex size-28 items-center justify-center rounded-full bg-accent-soft ring-[14px] ring-violet/35 lg:size-32">
            <Lightbulb className="size-11 text-accent-strong" strokeWidth={1.75} />
          </span>
          <span className="hidden items-center lg:flex">
            <span className="h-1.5 w-12 rounded-full bg-violet xl:w-20" />
            <span className="-ml-1 size-0 border-y-[11px] border-l-[16px] border-y-transparent border-l-violet" />
          </span>
          <ArrowDown className="mt-6 size-6 text-accent-ink lg:hidden" />
        </div>
        <Caption step={2}>Learn the concepts and try the hints before the deadline</Caption>
      </li>

      <li className="flex flex-col gap-8 lg:row-span-2 lg:grid lg:grid-rows-subgrid">
        <div aria-hidden="true" className="flex flex-1 items-center justify-center">
          <div className="relative w-64 rounded-card border border-border bg-card p-5 shadow-card">
            <span className="block h-2.5 w-3/4 rounded-full bg-surface" />
            <span className="mt-3 block h-2.5 w-full rounded-full bg-surface" />
            <span className="mt-3 block h-2.5 w-5/6 rounded-full bg-surface" />
            <span className="mt-3 block h-2.5 w-2/3 rounded-full bg-surface" />
            <span className="mt-5 -mr-8 ml-8 flex items-center gap-3 rounded-card border border-border bg-card p-3 shadow-card">
              <CheckCircle2 className="size-6 shrink-0 text-accent-ink" />
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-medium text-text">Worked solution</span>
                <span className="mt-1.5 block h-2 w-4/5 rounded-full bg-surface" />
              </span>
            </span>
            <span className="absolute -top-3 -right-3 rounded-full bg-green px-2.5 py-0.5 text-xs font-medium text-text">
              Unlocked
            </span>
          </div>
        </div>
        <Caption step={3}>Check the full walkthrough once the deadline passes</Caption>
      </li>
    </ol>
  )
}
