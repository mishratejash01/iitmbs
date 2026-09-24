import Link from 'next/link'

import { JsonLd } from '@/components/seo/json-ld'
import { breadcrumbJsonLd, type Crumb } from '@/lib/seo/jsonld'

/** Visible breadcrumbs plus matching BreadcrumbList structured data. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const crumbs: Crumb[] = [{ name: 'Home', path: '/' }, ...items]
  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-5" data-print="hide">
        {/* Earlier crumbs keep their width; the current page shortens with an ellipsis. */}
        <ol className="flex min-w-0 items-center gap-1 text-small whitespace-nowrap text-muted">
          {crumbs.map((crumb, index) => {
            const last = index === crumbs.length - 1
            return (
              <li
                key={crumb.path}
                className={
                  last ? 'flex min-w-0 items-center gap-1' : 'flex shrink-0 items-center gap-1'
                }
              >
                {index > 0 ? (
                  <span aria-hidden="true" className="shrink-0 px-1 text-border-strong">
                    /
                  </span>
                ) : null}
                {last ? (
                  <span aria-current="page" title={crumb.name} className="truncate text-text">
                    {crumb.name}
                  </span>
                ) : (
                  <Link
                    href={crumb.path}
                    className="rounded-sm py-1 underline-offset-4 hover:text-accent-ink hover:underline"
                    data-track="breadcrumb_click"
                    data-track-position={index + 1}
                  >
                    {crumb.name}
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
