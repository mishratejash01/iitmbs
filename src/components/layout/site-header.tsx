import Link from 'next/link'

import { AuthMenu } from '@/components/auth/auth-menu'
import { SearchTrigger } from '@/components/search/search-trigger'
import { ThemeToggle } from '@/components/theme/theme-toggle'
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
      className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur-md supports-[backdrop-filter]:bg-bg/80"
      data-print="hide"
    >
      <div className="container-page flex h-16 items-center gap-2">
        <Logo siteName={settings.site_name} />

        <nav aria-label="Primary" className="ml-4 hidden items-center gap-1 lg:flex">
          <ProgrammeSwitcher programs={programs} />
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="flex min-h-11 items-center rounded-control px-3 text-small font-medium text-text hover:bg-surface"
              data-track="nav_click"
              data-track-label={item.label}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          {settings.features.search ? <SearchTrigger /> : null}
          {settings.features.dark_mode ? <ThemeToggle /> : null}
          <AuthMenu />
          <MobileMenu items={items} programs={programs} />
        </div>
      </div>
    </header>
  )
}
