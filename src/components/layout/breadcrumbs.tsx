import { ChevronRight, House } from 'lucide-react'
import Link from 'next/link'

import { JsonLd } from '@/components/seo/json-ld'
import { breadcrumbJsonLd, type Crumb } from '@/lib/seo/jsonld'

/**
 * Visible breadcrumbs plus matching BreadcrumbList structured data. With
 * `hideCurrent`, the page itself is left out of the visible trail (articles
 * show their title right below) but stays in the structured data. The
 * `chevron` style (blog) shows a home icon and › separators, with the current
 * page in the accent colour.
 */
export function Breadcrumbs({
  items,
  hideCurrent = false,
  variant = 'slash',
}: {
  items: Crumb[]
  hideCurrent?: boolean
  variant?: 'slash' | 'chevron'
}) {
  const chevron = variant === 'chevron'
  const crumbs: Crumb[] = [{ name: 'Home', path: '/' }, ...items]
  const visible = hideCurrent ? crumbs.slice(0, -1) : crumbs
  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-5" data-print="hide">
        {/* Earlier crumbs keep their width; the current page shortens with an ellipsis. */}
        <ol className="flex min-w-0 items-center gap-1 text-small whitespace-nowrap text-muted">
          {visible.map((crumb, index) => {
            const last = !hideCurrent && index === crumbs.length - 1
            return (
              <li
                key={crumb.path}
                className={
                  last ? 'flex min-w-0 items-center gap-1' : 'flex shrink-0 items-center gap-1'
                }
              >
                {index > 0 ? (
                  chevron ? (
                    <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted" />
                  ) : (
                    <span aria-hidden="true" className="shrink-0 px-1 text-border-strong">
                      /
                    </span>
                  )
                ) : null}
                {last ? (
                  <span
                    aria-current="page"
                    title={crumb.name}
                    className={chevron ? 'truncate text-accent-ink' : 'truncate text-text'}
                  >
                    {crumb.name}
                  </span>
                ) : (
                  <Link
                    href={crumb.path}
                    className="rounded-sm py-1 underline-offset-4 hover:text-accent-ink hover:underline"
                    data-track="breadcrumb_click"
                    data-track-position={index + 1}
                  >
                    {chevron && index === 0 ? (
                      <>
                        <House aria-hidden="true" className="size-5 text-text" />
                        <span className="sr-only">{crumb.name}</span>
                      </>
                    ) : (
                      crumb.name
                    )}
                  </Link>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
    </>
  )
}
