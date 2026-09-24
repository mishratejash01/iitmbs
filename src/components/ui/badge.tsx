import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/utils/cn'

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger'

// Plain text in the tone's colour: no pills, so page meta reads like a byline.
const tones: Record<BadgeTone, string> = {
  neutral: 'text-muted',
  accent: 'font-semibold text-accent-ink',
  success: 'font-medium text-success',
  warning: 'font-medium text-warning',
  danger: 'font-medium text-danger',
}

export function Badge({
  tone = 'neutral',
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center text-small whitespace-nowrap',
        tones[tone],
        className,
      )}
      {...props}
    />
  )
}

/**
 * A row of badges separated by middle dots, e.g. "BSCS2007 · 49 papers · 2022 to 2026".
 * Every item carries a dot in a fixed box before it; the row is pulled left by
 * that box and clipped, so the dot at the start of each line (including after
 * a wrap) is hidden. The clip leaves room for focus outlines.
 */
export const metaRowClasses =
  "-ml-5 flex flex-wrap items-center gap-y-1 [clip-path:inset(-4px_-4px_-4px_calc(1.25rem-4px))] [&>*]:before:inline-block [&>*]:before:w-5 [&>*]:before:text-center [&>*]:before:text-border-strong [&>*]:before:content-['·']"
