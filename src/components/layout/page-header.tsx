import type { ReactNode } from 'react'

import type { Crumb } from '@/lib/seo/jsonld'

import { Breadcrumbs } from './breadcrumbs'

export function PageHeader({
  crumbs,
  eyebrow,
  title,
  description,
  meta,
  actions,
}: {
  crumbs: Crumb[]
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  meta?: ReactNode
  actions?: ReactNode
}) {
  return (
    <header className="border-b border-border bg-surface">
      <div className="container-page py-7 sm:py-10">
        <Breadcrumbs items={crumbs} />
        {eyebrow ? <p className="text-small font-medium text-accent-ink">{eyebrow}</p> : null}
        <h1 className="mt-1 max-w-4xl text-[1.75rem] leading-9 font-semibold tracking-tight text-text sm:text-h1">
          {title}
        </h1>
        {description ? <div className="mt-3 max-w-3xl text-muted">{description}</div> : null}
        {meta ? <div className="mt-4 flex flex-wrap items-center gap-2">{meta}</div> : null}
        {actions ? <div className="mt-5 flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  )
}
