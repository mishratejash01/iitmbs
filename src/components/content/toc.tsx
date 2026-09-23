import type { TocItem } from '@/lib/mdx/process'
import { cn } from '@/lib/utils/cn'

export function Toc({ items, className }: { items: TocItem[]; className?: string }) {
  if (items.length < 2) return null
  return (
    <nav aria-label="On this page" className={className}>
      <p className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">On this page</p>
      <ol className="space-y-1 border-l border-border">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={cn(
                '-ml-px block border-l border-transparent py-1 text-small text-muted hover:border-accent hover:text-text',
                item.depth === 3 ? 'pl-6' : 'pl-3',
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
export function MobileToc({ items }: { items: TocItem[] }) {
  if (items.length < 2) return null
  return (
    <details className="mb-6 rounded-card border border-border bg-card lg:hidden">
      <summary className="flex min-h-12 cursor-pointer items-center px-4 font-medium text-text">On this page</summary>
      <Toc items={items} className="px-4 pb-4" />
    </details>
  )
}
