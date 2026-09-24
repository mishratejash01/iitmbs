import Link from 'next/link'

import { AuthMenu } from '@/components/auth/auth-menu'
import { SearchTrigger } from '@/components/search/search-trigger'
import { getNavItems } from '@/lib/data/navigation'
import { getPrograms } from '@/lib/data/programs'
import type { SiteSettings } from '@/lib/settings/schema'

import { Logo } from './logo'
import { MobileMenu } from './mobile-menu'
import { ProgrammeSwitcher } from './programme-switcher'

export async function SiteHeader({ settings }: { settings: SiteSettings }) {
  const [items, programs] = await Promise.all([getNavItems('header'), getPrograms()])
  const navItems = items.filter((item) => !programs.some((p) => p.path === item.href))

  return (
    <header
      className="sticky top-0 z-40 border-b border-border bg-bg/95 backdrop-blur-md supports-[backdrop-filter]:bg-bg/85"
      data-print="hide"
    >
      <div className="container-page flex h-[4.5rem] items-center gap-2">
        <Logo siteName={settings.site_name} />

        <nav aria-label="Primary" className="ml-6 hidden items-center gap-0.5 lg:flex">
          <ProgrammeSwitcher programs={programs} />
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="flex min-h-11 items-center px-3 text-small font-medium text-text underline-offset-8 hover:text-accent-ink hover:underline"
              data-track="nav_click"
              data-track-label={item.label}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          {settings.features.search ? <SearchTrigger /> : null}
          <AuthMenu />
          <MobileMenu items={items} programs={programs} />
        </div>
      </div>
    </header>
  )
}
