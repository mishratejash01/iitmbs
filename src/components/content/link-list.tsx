import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

export type LinkListItem = { path: string; title: string }

export function LinkList({ items, label }: { items: LinkListItem[]; label: string }) {
  if (items.length === 0) return null
  return (
    <ul
      aria-label={label}
      className="divide-y divide-border rounded-card border border-border bg-card"
    >
      {items.map((item) => (
        <li key={item.path}>
          <Link
            href={item.path}
            className="group flex items-center gap-3 px-4 py-3.5 hover:bg-surface"
            data-track-area="list"
          >
            <span className="min-w-0 flex-1">
              <span className="block font-medium text-text group-hover:text-accent-ink">
                {item.title}
              </span>
            </span>
            <ArrowRight
              aria-hidden="true"
              className="size-4 shrink-0 text-muted group-hover:text-accent-ink"
            />
          </Link>
        </li>
      ))}
    </ul>
  )
}
