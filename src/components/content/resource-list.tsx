import type { ResourceItem } from '@/lib/data/types'
import { formatBytes } from '@/lib/utils/format'

/**
 * Every resource goes through /api/download/<id> so downloads and outbound
 * clicks are counted server-side before redirecting to the file or site.
 */
export function ResourceList({
  items,
  label = 'Resources',
}: {
  items: ResourceItem[]
  label?: string
}) {
  if (items.length === 0) return null
  return (
    <ul aria-label={label} className="border-t border-border">
      {items.map((item) => {
        const size = formatBytes(item.fileBytes)
        return (
          <li key={item.id} className="border-b border-border">
            <a
              href={`/api/download/${item.id}`}
              className="group flex items-baseline justify-between gap-4 py-4"
              data-track="download_click"
              data-track-resource-id={item.id}
              data-track-kind={item.kind}
              target={item.isExternal ? '_blank' : undefined}
              rel={item.isExternal ? 'noopener noreferrer' : 'nofollow'}
            >
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-text decoration-accent-ink/40 underline-offset-4 group-hover:text-accent-ink group-hover:underline">
                  {item.title}
                </span>
                {item.description ? (
                  <span className="mt-0.5 block text-small text-muted">{item.description}</span>
                ) : null}
                <span className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted">
                  {item.contributor ? <span>by {item.contributor}</span> : null}
                  {item.isExternal && item.host ? <span>{item.host}</span> : null}
                  {item.fileFormat ? <span className="uppercase">{item.fileFormat}</span> : null}
                  {size ? <span>{size}</span> : null}
                  {item.requiresLogin ? <span>Sign-in required</span> : null}
                </span>
              </span>
              <span className="shrink-0 text-small font-semibold text-accent-ink">
                {item.isExternal ? 'Open' : 'Download'}
              </span>
              {item.isExternal ? <span className="sr-only">(opens in a new tab)</span> : null}
            </a>
          </li>
        )
      })}
    </ul>
  )
}
