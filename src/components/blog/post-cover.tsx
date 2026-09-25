import {
  BadgeCheck,
  BookOpen,
  Briefcase,
  CalendarDays,
  CircleHelp,
  Cpu,
  DoorOpen,
  GraduationCap,
  IndianRupee,
  Layers,
  Lightbulb,
  type LucideIcon,
  Newspaper,
  PenLine,
  Puzzle,
  Scale,
  ScrollText,
  Users,
} from 'lucide-react'

import { LogoMark } from '@/components/layout/logo'
import type { BlogPostSummary } from '@/lib/data/blog'
import { cn } from '@/lib/utils/cn'

// Category slugs are admin-editable; unknown ones fall back to a newspaper.
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  about: GraduationCap,
  decisions: CircleHelp,
  admissions: DoorOpen,
  fees: IndianRupee,
  comparisons: Scale,
  recognition: BadgeCheck,
  structure: Layers,
  courses: BookOpen,
  minors: Puzzle,
  exams: PenLine,
  rules: ScrollText,
  careers: Briefcase,
  'study-tips': Lightbulb,
  'electronic-systems': Cpu,
  'exam-dates': CalendarDays,
  'student-life': Users,
}

// Every pair keeps text at 7:1 or better (see the highlight rules in contrast.ts).
const TONES = [
  { tile: 'bg-accent-strong', text: 'text-on-accent', accent: 'text-lime', badge: 'bg-lime' },
  {
    tile: 'bg-accent-soft',
    text: 'text-accent-strong',
    accent: 'text-accent-ink',
    badge: 'bg-card',
  },
  { tile: 'bg-lime', text: 'text-accent-strong', accent: 'text-accent-strong', badge: 'bg-card' },
  { tile: 'bg-sky', text: 'text-text', accent: 'text-text', badge: 'bg-card' },
  { tile: 'bg-sun', text: 'text-text', accent: 'text-text', badge: 'bg-card' },
] as const

// e.g. "…Bioinformatics (BSBT4001): Syllabus and Tips" → "BSBT4001"
const COURSE_CODE = /\s*\(([A-Z]{2,5}\d{3,4}[A-Z]?)\)/

/** Stable small number from a string, so a post always gets the same banner. */
function hash(value: string): number {
  let h = 0
  for (const char of value) h = (h * 31 + char.charCodeAt(0)) >>> 0
  return h
}

/** The banner's headline: the title up to its colon, without the course code or site prefix. */
function headline(title: string): string {
  const main = (title.split(':')[0] ?? title).replace(COURSE_CODE, '').trim()
  // "IITM BS Data Science Fees" drops the prefix; "IITM BS in Data Science" keeps it.
  return main.replace(/^IITM BS\s+(?=[A-Z0-9])/, '') || main
}

/**
 * A banner for a post, like a blog thumbnail: brand mark, the headline, the
 * topic and its icon (or the course code for course guides). Built from
 * theme tokens and text, so there are no images to load. The `thumb` size
 * keeps only the colour and icon. Decorative: the real title is next to it.
 */
export function PostCover({
  post,
  size = 'card',
  className,
}: {
  post: Pick<BlogPostSummary, 'id' | 'title' | 'category'>
  size?: 'card' | 'large' | 'thumb'
  className?: string
}) {
  const tone = TONES[hash(post.id) % TONES.length] ?? TONES[0]
  const code = COURSE_CODE.exec(post.title)?.[1]
  const Icon = CATEGORY_ICONS[post.category.slug] ?? Newspaper
  const dark = tone.tile === 'bg-accent-strong'

  if (size === 'thumb') {
    return (
      <div
        aria-hidden="true"
        className={cn(
          'flex aspect-[7/5] items-center justify-center rounded-[min(6px,var(--radius-control))]',
          tone.tile,
          tone.accent,
          className,
        )}
      >
        <Icon className="size-6" strokeWidth={1.75} />
      </div>
    )
  }

  return (
    <div
      aria-hidden="true"
      className={cn(
        '@container flex aspect-[7/5] flex-col justify-between overflow-hidden rounded-[min(6px,var(--radius-control))] p-[6%]',
        size === 'large' && 'aspect-video',
        tone.tile,
        tone.text,
        className,
      )}
    >
      <div className="flex items-center gap-[2.5cqw]">
        <LogoMark inverse={dark} className="size-[8cqw] max-h-9 max-w-9" />
        <span className="text-[3.6cqw] font-semibold tracking-wide uppercase">IITM BS</span>
        {code ? (
          <span
            className={cn(
              'ml-auto rounded-[min(4px,var(--radius-control))] px-[2cqw] py-[0.6cqw] font-mono text-[3.4cqw] font-semibold text-accent-strong',
              tone.badge,
            )}
          >
            {code}
          </span>
        ) : null}
      </div>
      <p
        className={cn(
          'line-clamp-3 leading-[1.15] font-bold tracking-tight',
          size === 'large' ? 'text-[7cqw] sm:text-[5.2cqw]' : 'text-[7.4cqw]',
        )}
      >
        {headline(post.title)}
      </p>
      <div className="flex items-end justify-between gap-[3cqw]">
        <span className={cn('text-[3.4cqw] font-semibold tracking-wide uppercase', tone.accent)}>
          {post.category.name}
        </span>
        <span
          className={cn(
            'flex size-[11cqw] shrink-0 items-center justify-center rounded-full',
            dark ? 'bg-on-accent/10 text-lime' : 'bg-card/70 text-accent-strong',
          )}
        >
          <Icon className="size-[55%]" strokeWidth={1.75} />
        </span>
      </div>
    </div>
  )
}
