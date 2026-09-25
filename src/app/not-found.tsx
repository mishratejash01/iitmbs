import type { Metadata } from 'next'

import { AnnouncementBar } from '@/components/layout/announcement-bar'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { NotFoundContent } from '@/components/not-found/not-found-content'
import { getSiteSettings } from '@/lib/data/settings'

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: true },
}

/**
 * URLs that match no route at all. The root layout has no header or footer,
 * so this adds them around the same body as the public pages' 404.
 */
export default async function NotFound() {
  const settings = await getSiteSettings()
  return (
    <>
      <AnnouncementBar announcement={settings.announcement} />
      <SiteHeader settings={settings} />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        <NotFoundContent />
      </main>
      <SiteFooter settings={settings} />
    </>
  )
}
