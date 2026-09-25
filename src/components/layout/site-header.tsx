import Link from 'next/link'

import { AuthMenu } from '@/components/auth/auth-menu'
import { SearchTrigger } from '@/components/search/search-trigger'
import { getNavItems } from '@/lib/data/navigation'
import { getPrograms } from '@/lib/data/programs'
import { displayName, type SiteSettings } from '@/lib/settings/schema'

import { HeaderShell } from './header-shell'
import { Logo } from './logo'
import { MobileMenu } from './mobile-menu'
import { ProgrammeSwitcher } from './programme-switcher'

export async function SiteHeader({ settings }: { settings: SiteSettings }) {
  const [items, programs] = await Promise.all([getNavItems('header'), getPrograms()])
  const navItems = items.filter((item) => !programs.some((p) => p.path === item.href))

  return (
    <HeaderShell>
      <div className="container-page flex h-[4.5rem] items-center gap-2">
        <Logo siteName={displayName(settings)} />

        <nav aria-label="Primary" className="ml-4 hidden items-center gap-0.5 lg:flex xl:ml-6">
          <ProgrammeSwitcher programs={programs} />
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="flex min-h-11 items-center px-2.5 text-small font-medium whitespace-nowrap text-text underline-offset-8 group-data-[tone=dark]/header:text-on-accent hover:text-accent-ink hover:underline group-data-[tone=dark]/header:hover:text-lime xl:px-3"
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
    </HeaderShell>
  )
}
