import {
  ArrowDown,
  CircleCheck,
  CirclePlay,
  FileText,
  Lightbulb,
  type LucideIcon,
  Newspaper,
  NotebookPen,
} from 'lucide-react'
import type { ReactNode } from 'react'

import { LogoMark } from '@/components/layout/logo'
import { cn } from '@/lib/utils/cn'

type Source = { label: string; detail: string; icon: LucideIcon; tone: string; tag?: string }

// What the site gathers. The qualifier help is tagged for new students.
const SOURCES: Source[] = [
  { label: 'Student notes', detail: 'Handwritten and PDF', icon: NotebookPen, tone: 'bg-lime' },
  {
    label: 'Previous year papers',
    detail: 'Quiz, end term and more',
    icon: FileText,
    tone: 'bg-violet',
  },
  { label: 'IIT Madras lectures', detail: 'Week by week', icon: CirclePlay, tone: 'bg-sky' },
  { label: 'Guides', detail: 'Plain, sourced answers', icon: Newspaper, tone: 'bg-sun' },
  {
    label: 'Qualifier help',
    detail: 'Hints and walkthroughs',
    icon: Lightbulb,
    tone: 'bg-green',
    tag: 'New students',
  },
]
// Staggered so the stack reads as a loose pile.
const OFFSETS = ['ml-0', 'ml-10', 'ml-4', 'ml-12', 'ml-2'] as const
const COURSE_ROWS = ['Notes', 'Previous year papers', 'Lectures', 'Guides'] as const

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
 * "All the best resources, in one place": notes, papers, lectures, guides and
 * the qualifier help flow into the site (the mark) and come out as one course,
 * with everything for it. On wide screens the sources fan in with curved
 * lines; on phones the steps stack. The drawing is decorative; the captions
 * carry the meaning.
 */
export function ResourceFlow({ course }: { course: string }) {
  return (
    <ol className="grid gap-10 lg:grid-cols-[1fr_auto_1fr] lg:grid-rows-[1fr_auto] lg:gap-x-0 lg:gap-y-8">
      <li className="flex flex-col gap-8 lg:row-span-2 lg:grid lg:grid-rows-subgrid">
        <div
          aria-hidden="true"
          className="flex flex-1 flex-col justify-around self-center lg:self-stretch lg:justify-self-end"
        >
          {SOURCES.map((source, index) => (
            <span
              key={source.label}
              className={cn(
                'relative z-10 my-1.5 flex w-56 items-center gap-3 rounded-card bg-card px-3 py-2.5 text-left shadow-card',
                OFFSETS[index % OFFSETS.length],
              )}
            >
              <span
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-control text-accent-strong',
                  source.tone,
                )}
              >
                <source.icon className="size-4" />
              </span>
              {source.tag ? (
                <span className="absolute -top-4 -right-2 rounded-full bg-accent-strong px-2 py-0.5 text-[0.625rem] font-medium whitespace-nowrap text-on-accent">
                  {source.tag}
                </span>
              ) : null}
              <span className="min-w-0">
                <span className="block text-small font-medium text-text">{source.label}</span>
                <span className="block truncate text-xs text-muted">{source.detail}</span>
              </span>
            </span>
          ))}
        </div>
        <Caption step={1} className="lg:mr-0">
          Notes, papers, lectures and guides from across the degree
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
            {SOURCES.map((source, index) => {
              const y = ((index + 0.5) / SOURCES.length) * 100
              return (
                <path
                  key={source.label}
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
            <LogoMark className="size-14" />
          </span>
          <span className="hidden items-center lg:flex">
            <span className="h-1.5 w-12 rounded-full bg-violet xl:w-20" />
            <span className="-ml-1 size-0 border-y-[11px] border-l-[16px] border-y-transparent border-l-violet" />
          </span>
          <ArrowDown className="mt-6 size-6 text-accent-ink lg:hidden" />
        </div>
        <Caption step={2}>Sorted by level, course and week</Caption>
      </li>

      <li className="flex flex-col gap-8 lg:row-span-2 lg:grid lg:grid-rows-subgrid">
        <div aria-hidden="true" className="flex flex-1 items-center justify-center">
          <div className="relative w-64 rounded-card border border-border bg-card p-5 text-left shadow-card">
            <p className="text-small font-semibold text-text">{course}</p>
            <ul className="mt-3 space-y-2.5">
              {COURSE_ROWS.map((row) => (
                <li key={row} className="flex items-center gap-2.5 text-small text-text">
                  <CircleCheck className="size-5 shrink-0 text-accent-ink" />
                  {row}
                </li>
              ))}
            </ul>
            <span className="absolute -top-3 -right-3 rounded-full bg-green px-2.5 py-0.5 text-xs font-medium text-text">
              All in one place
            </span>
          </div>
        </div>
        <Caption step={3}>Everything for your course, found in one place</Caption>
      </li>
    </ol>
  )
}
