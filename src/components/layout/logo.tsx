import Link from 'next/link'

import { MARK } from '@/lib/brand/mark'
import { cn } from '@/lib/utils/cn'

/**
 * Brand mark (see src/lib/brand/mark.ts): a white corner holding a lime dot
 * on the green tile; `inverse` draws it on lavender for the green bands.
 * Sized by `className` (default 32px). Decorative only.
 */
export function LogoMark({
  className,
  inverse = false,
}: {
  className?: string
  inverse?: boolean
}) {
  // A dark header recolours the plain mark through --logo-tile, --logo-stroke and --logo-dot.
  const tile = inverse ? 'var(--accent-soft)' : 'var(--logo-tile, var(--accent-strong))'
  const line = inverse ? 'var(--accent-strong)' : 'var(--logo-stroke, #fff)'
  const dot = inverse ? 'var(--accent-strong)' : 'var(--logo-dot, var(--lime))'
  return (
    <svg
      viewBox={MARK.viewBox}
      aria-hidden="true"
      className={cn('shrink-0', className ?? 'size-8')}
    >
      <rect width="32" height="32" rx={MARK.radius} fill={tile} />
      <path
        d={MARK.corner}
        fill="none"
        stroke={line}
        strokeWidth={MARK.stroke}
        strokeLinecap="round"
      />
      <circle cx={MARK.dot.cx} cy={MARK.dot.cy} r={MARK.dot.r} fill={dot} />
    </svg>
  )
}

/**
 * The name next to the mark, on one line. For "IITM BS Students' Corner" the
 * "IITM BS" is lighter and the rest bold, so the name reads first. `compact`
 * (the header) drops the prefix on phones narrower than 400px.
 */
export function Wordmark({
  name,
  compact = false,
  className,
}: {
  name: string
  compact?: boolean
  className?: string
}) {
  const [, prefix, rest] = /^(IITM BS)\s+(.+)$/i.exec(name) ?? []
  return (
    <span className={cn('tracking-tight whitespace-nowrap', className)}>
      {prefix && rest ? (
        <>
          <span className={cn('font-normal', compact && 'hidden min-[400px]:inline')}>
            {prefix}{' '}
          </span>
          <span className="font-bold">{rest}</span>
        </>
      ) : (
        <span className="font-bold">{name}</span>
      )}
    </span>
  )
}

export function Logo({ siteName, className }: { siteName: string; className?: string }) {
  return (
    <Link
      href="/"
      aria-label={`${siteName}, home`}
      className={cn(
        'flex min-h-11 shrink-0 items-center gap-2 rounded-control text-text group-data-[tone=dark]/header:text-on-accent sm:gap-2.5',
        className,
      )}
      data-track="nav_click"
      data-track-label="logo"
    >
      <LogoMark className="size-8 sm:size-9" />
      {/* Below 360px only the mark fits next to the menu; the link keeps its label. */}
      <Wordmark
        name={siteName}
        compact
        className="hidden text-[0.9375rem] min-[360px]:inline sm:text-[1.0625rem] xl:text-[1.125rem]"
      />
    </Link>
  )
}
