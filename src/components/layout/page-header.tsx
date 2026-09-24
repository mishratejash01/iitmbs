import type { ReactNode } from 'react'

import { metaRowClasses } from '@/components/ui/badge'
import type { Crumb } from '@/lib/seo/jsonld'

import { Breadcrumbs } from './breadcrumbs'

/** Page title on a soft peach band, with breadcrumbs and a byline-style meta row. */
export function PageHeader({
  crumbs,
  title,
  meta,
  actions,
}: {
  crumbs: Crumb[]
  title: ReactNode
  meta?: ReactNode
  actions?: ReactNode
}) {
  return (
    <header className="bg-surface">
      <div className="container-page pt-8 pb-10 sm:pt-10 sm:pb-12">
        <Breadcrumbs items={crumbs} />
        <h1 className="max-w-4xl text-[1.875rem] leading-[2.375rem] font-semibold text-text sm:text-[2.625rem] sm:leading-[3.25rem]">
          {title}
        </h1>
        {meta ? <div className={`mt-5 ${metaRowClasses}`}>{meta}</div> : null}
        {actions ? <div className="mt-6 flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  )
}
