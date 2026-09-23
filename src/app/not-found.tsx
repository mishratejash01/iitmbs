import { Search } from 'lucide-react'
import type { Metadata } from 'next'

import { PageContext } from '@/components/analytics/page-context'
import { LinkList } from '@/components/content/link-list'
import { AnnouncementBar } from '@/components/layout/announcement-bar'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { Button } from '@/components/ui/button'
import { getLinkIndex } from '@/lib/data/links'
import { getSiteSettings } from '@/lib/data/settings'

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: true },
}

export default async function NotFound() {
  const [settings, linkIndex] = await Promise.all([getSiteSettings(), getLinkIndex()])
  const popular = settings.home.popular_paths.flatMap((path) => {
    const entry = linkIndex[path]
    return entry ? [{ path, title: entry.title, summary: entry.summary }] : []
  })

  return (
    <>
      <AnnouncementBar announcement={settings.announcement} />
      <SiteHeader settings={settings} />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        <PageContext type="404" />
        <div className="container-page py-16">
          <div className="container-reading">
            <p className="text-small font-semibold text-accent-ink">404</p>
            <h1 className="mt-2 text-h1 font-semibold text-text">We couldn’t find that page</h1>
            <p className="mt-3 text-muted">
              The link may be old, or the page may have moved. Search for the course, week or topic you need:
            </p>
            <form action="/search" role="search" className="mt-6 flex gap-2">
              <label htmlFor="notfound-search" className="sr-only">
                Search the site
              </label>
              <div className="relative flex-1">
                <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted" />
                <input
                  id="notfound-search"
                  name="q"
                  type="search"
                  placeholder="e.g. stats 1 week 3"
                  className="min-h-12 w-full rounded-control border border-border-strong bg-card pr-3 pl-10 text-text placeholder:text-muted focus-visible:border-accent"
                />
              </div>
              <Button type="submit" size="lg">
                Search
              </Button>
            </form>
            {popular.length > 0 ? (
              <section aria-labelledby="popular-404" className="mt-10">
                <h2 id="popular-404" className="mb-3 font-semibold text-text">
                  Popular pages
                </h2>
                <LinkList items={popular} label="Popular pages" />
              </section>
            ) : null}
          </div>
        </div>
      </main>
      <SiteFooter settings={settings} />
    </>
  )
}
