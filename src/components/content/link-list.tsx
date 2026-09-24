import Link from 'next/link'

export type LinkListItem = { path: string; title: string }

/** A plain list of links between hairlines. */
export function LinkList({ items, label }: { items: LinkListItem[]; label: string }) {
  if (items.length === 0) return null
  return (
    <ul aria-label={label} className="border-t border-border">
      {items.map((item) => (
        <li key={item.path} className="border-b border-border">
          <Link
            href={item.path}
            className="group flex min-h-14 items-center py-3.5 font-medium text-text"
            data-track-area="list"
          >
            <span className="decoration-accent-ink/40 underline-offset-4 group-hover:text-accent-ink group-hover:underline">
              {item.title}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
