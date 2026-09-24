import Link from 'next/link'

type Target = { href: string; label: string; title?: string } | null

export function PrevNext({ previous, next }: { previous: Target; next: Target }) {
  if (!previous && !next) return null
  const box = 'group block border-t-2 border-accent-strong pt-4'
  return (
    <nav
      aria-label="Previous and next"
      className="mt-12 grid gap-6 sm:grid-cols-2"
      data-print="hide"
    >
      {previous ? (
        <Link href={previous.href} className={box} data-track-area="prev-next">
          <span className="block text-xs font-semibold tracking-wide text-muted uppercase">
            {previous.label}
          </span>
          {previous.title ? (
            <span className="mt-1 block font-semibold text-text group-hover:text-accent-ink group-hover:underline">
              {previous.title}
            </span>
          ) : null}
        </Link>
      ) : (
        <span className="hidden sm:block" />
      )}
      {next ? (
        <Link href={next.href} className={`${box} sm:text-right`} data-track-area="prev-next">
          <span className="block text-xs font-semibold tracking-wide text-muted uppercase">
            {next.label}
          </span>
          {next.title ? (
            <span className="mt-1 block font-semibold text-text group-hover:text-accent-ink group-hover:underline">
              {next.title}
            </span>
          ) : null}
        </Link>
      ) : null}
    </nav>
  )
}
