import { AnnouncementBar } from '@/components/layout/announcement-bar'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { getSiteSettings } from '@/lib/data/settings'

export default async function PublicLayout({ children }: LayoutProps<'/'>) {
  const settings = await getSiteSettings()
  return (
    <>
      <AnnouncementBar announcement={settings.announcement} />
      <SiteHeader settings={settings} />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <SiteFooter settings={settings} />
    </>
  )
}
