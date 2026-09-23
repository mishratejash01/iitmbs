import type { ReactNode } from 'react'

import type { TocItem } from '@/lib/mdx/process'

import { MobileToc, Toc } from './toc'

/** Reading layout: ~720px column with a sticky table of contents on desktop. */
export function ArticleShell({ toc = [], children, aside }: { toc?: TocItem[]; children: ReactNode; aside?: ReactNode }) {
  const hasSidebar = toc.length >= 2 || Boolean(aside)
  return (
    <div className="container-page py-8 sm:py-10">
      <div className={hasSidebar ? 'lg:grid lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-12' : ''}>
        <div className="container-reading min-w-0">
          <MobileToc items={toc} />
          {children}
        </div>
        {hasSidebar ? (
          <aside className="hidden lg:block" data-print="hide">
            <div className="sticky top-24 space-y-6">
              <Toc items={toc} />
              {aside}
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  )
}
