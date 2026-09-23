import type { Metadata } from 'next'
import Link from 'next/link'

import { AdminNav, type AdminNavGroup } from '@/components/admin/admin-nav'
import { LogoMark } from '@/components/layout/logo'
import { Badge } from '@/components/ui/badge'
import { RESOURCES } from '@/lib/admin/resources'
import { requireStaff } from '@/lib/auth/session'
import { getSiteSettings } from '@/lib/data/settings'

// Every admin request checks the session and role up front.
export const instant = false

export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
}

export default async function AdminLayout({ children }: LayoutProps<'/admin'>) {
  const [profile, settings] = await Promise.all([requireStaff('/admin'), getSiteSettings()])
  const isAdmin = profile.role === 'admin'

  const resourceGroups = ['Content', 'Library', 'Site', 'SEO', 'Analytics'] as const
  const groups: AdminNavGroup[] = [
    {
      label: 'Overview',
      links: [
        { href: '/admin', label: 'Dashboard' },
        { href: '/admin/analytics', label: 'Analytics' },
        { href: '/admin/feedback', label: 'Feedback' },
      ],
    },
    ...resourceGroups
      .map((group) => ({
        label: group,
        links: [
          ...RESOURCES.filter((r) => r.group === group && (isAdmin || !r.adminOnly)).map((r) => ({
            href: `/admin/${r.key}`,
            label: r.label,
          })),
          ...(group === 'Content' ? [{ href: '/admin/import', label: 'Bulk import' }] : []),
          ...(group === 'SEO' ? [{ href: '/admin/seo', label: 'SEO report' }] : []),
          ...(group === 'Site' && isAdmin
            ? [
                { href: '/admin/settings', label: 'Settings' },
                { href: '/admin/users', label: 'Users' },
                { href: '/admin/audit', label: 'Audit log' },
              ]
            : []),
        ],
      }))
      .filter((group) => group.links.length > 0),
  ]

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="border-b border-border bg-card">
        <div className="flex min-h-14 items-center gap-3 px-4 sm:px-6">
          <Link
            href="/admin"
            aria-label={`${settings.site_name} admin home`}
            className="flex min-h-11 items-center gap-2 font-semibold text-text"
          >
            <LogoMark className="size-7" />
            <span className="hidden sm:inline">{settings.site_name}</span>
          </Link>
          <Badge tone="accent">{isAdmin ? 'Admin' : 'Editor'}</Badge>
          <div className="ml-auto flex items-center gap-1 text-small whitespace-nowrap sm:gap-2">
            <span className="hidden text-muted sm:inline">{profile.email}</span>
            <Link
              href="/"
              className="flex min-h-11 items-center rounded-control px-3 text-text hover:bg-surface"
            >
              View site
            </Link>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="flex min-h-11 items-center rounded-control px-3 text-muted hover:bg-surface hover:text-text"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-6 px-4 py-4 sm:px-6 lg:flex-row lg:py-6">
        <aside className="lg:sticky lg:top-6 lg:w-56 lg:shrink-0 lg:self-start">
          <AdminNav groups={groups} />
        </aside>
        <main id="main" tabIndex={-1} className="min-w-0 flex-1 outline-none">
          {children}
        </main>
      </div>
    </div>
  )
}
