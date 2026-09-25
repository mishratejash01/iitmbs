import type { TocItem } from '@/lib/mdx/process'
import { cn } from '@/lib/utils/cn'

export function Toc({
  items,
  className,
  heading = true,
}: {
  items: TocItem[]
  className?: string
  /** Hide the visible label when a surrounding control already shows it. */
  heading?: boolean
}) {
  if (items.length < 2) return null
  return (
    <nav aria-label="On this page" className={className}>
      {heading ? (
        <p className="mb-4 text-xs font-semibold tracking-[0.08em] text-muted uppercase">
          On this page
        </p>
      ) : null}
      <ol className="space-y-0.5">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={cn(
                'block py-1.5 text-muted hover:text-accent-ink hover:underline',
                item.depth === 3 ? 'pl-4 text-xs leading-5' : 'text-small',
              )}
              data-track="toc_click"
              data-track-heading={item.text.slice(0, 80)}
              data-track-level={item.depth}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}

/** Collapsible TOC for small screens. */
export function MobileToc({ items, className }: { items: TocItem[]; className?: string }) {
  if (items.length < 2) return null
  return (
    <details className={cn('group mb-10 border-y border-border lg:hidden', className)}>
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 text-small font-semibold text-text [&::-webkit-details-marker]:hidden">
        On this page
        <span
          aria-hidden="true"
          className="text-h3 leading-none font-normal text-accent-ink group-open:hidden"
        >
          +
        </span>
        <span
          aria-hidden="true"
          className="hidden text-h3 leading-none font-normal text-accent-ink group-open:inline"
        >
          −
        </span>
      </summary>
      <Toc items={items} heading={false} className="pb-5" />
    </details>
  )
}
