import { Download, ExternalLink, FileText, Lock, PlayCircle, Sheet } from 'lucide-react'

import type { ResourceItem } from '@/lib/data/types'
import { formatBytes } from '@/lib/utils/format'

const ICONS = { pdf: FileText, sheet: Sheet, link: ExternalLink, video: PlayCircle }

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
    <ul
      aria-label={label}
      className="divide-y divide-border rounded-card border border-border bg-card"
    >
      {items.map((item) => {
        const Icon = ICONS[item.kind]
        const size = formatBytes(item.fileBytes)
        return (
          <li key={item.id}>
            <a
              href={`/api/download/${item.id}`}
              className="group flex items-start gap-3 px-4 py-3.5 hover:bg-surface"
              data-track="download_click"
              data-track-resource-id={item.id}
              data-track-kind={item.kind}
              target={item.isExternal ? '_blank' : undefined}
              rel={item.isExternal ? 'noopener noreferrer' : 'nofollow'}
            >
              <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-accent-ink" />
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-text group-hover:text-accent-ink">
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
                  {item.requiresLogin ? (
                    <span className="inline-flex items-center gap-1">
                      <Lock aria-hidden="true" className="size-3" /> Sign-in required
                    </span>
                  ) : null}
                </span>
              </span>
              {item.isExternal ? (
                <ExternalLink aria-hidden="true" className="mt-1 size-4 shrink-0 text-muted" />
              ) : (
                <Download aria-hidden="true" className="mt-1 size-4 shrink-0 text-muted" />
              )}
              {item.isExternal ? <span className="sr-only">(opens in a new tab)</span> : null}
            </a>
          </li>
        )
      })}
    </ul>
  )
}
