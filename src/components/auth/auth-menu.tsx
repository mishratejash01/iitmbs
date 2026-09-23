'use client'

import { LayoutDashboard, LogOut, Shield, Bookmark, History } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo } from 'react'

import { Disclosure } from '@/components/ui/disclosure'
import { track } from '@/lib/analytics/client'
import { decodeDisplayUser, DISPLAY_COOKIE } from '@/lib/auth/display-cookie'
import { useCookie } from '@/lib/hooks/browser-state'

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export function AuthMenu() {
  const pathname = usePathname()
  // Null on the server, so static HTML is identical for everyone.
  const cookie = useCookie(DISPLAY_COOKIE)
  const user = useMemo(() => decodeDisplayUser(cookie), [cookie])

  if (!user) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(pathname)}`}
        onClick={() => track('login_click', { provider: 'google', source: 'header' })}
        className="flex min-h-11 min-w-[4.5rem] items-center justify-center rounded-control px-3 text-small font-medium text-text hover:bg-surface"
      >
        Log in
      </Link>
    )
  }

  const itemClass =
    'flex min-h-11 w-full items-center gap-2 rounded-control px-3 text-small text-text hover:bg-surface'
  return (
    <Disclosure
      label={`Account menu for ${user.name}`}
      summaryClassName="flex size-11 cursor-pointer items-center justify-center rounded-full"
      summary={
        user.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element -- tiny avatar from the identity provider
          <img
            src={user.avatar}
            alt=""
            width={32}
            height={32}
            referrerPolicy="no-referrer"
            className="size-8 rounded-full"
          />
        ) : (
          <span className="flex size-8 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent-ink">
            {initials(user.name)}
          </span>
        )
      }
      panelClassName="absolute right-0 top-full z-50 mt-2 w-56 rounded-card border border-border bg-card p-2 shadow-card"
    >
      <p className="truncate px-3 pt-1 pb-2 text-xs text-muted">Signed in as {user.name}</p>
      <ul>
        <li>
          <Link href="/dashboard" className={itemClass}>
            <LayoutDashboard aria-hidden="true" className="size-4 text-muted" /> Dashboard
          </Link>
        </li>
        <li>
          <Link href="/dashboard/bookmarks" className={itemClass}>
            <Bookmark aria-hidden="true" className="size-4 text-muted" /> Bookmarks
          </Link>
        </li>
        <li>
          <Link href="/dashboard/history" className={itemClass}>
            <History aria-hidden="true" className="size-4 text-muted" /> History
          </Link>
        </li>
        {user.staff ? (
          <li>
            <Link href="/admin" className={itemClass}>
              <Shield aria-hidden="true" className="size-4 text-muted" /> Admin
            </Link>
          </li>
        ) : null}
        <li className="mt-1 border-t border-border pt-1">
          <form action="/auth/signout" method="post">
            <button type="submit" className={itemClass}>
              <LogOut aria-hidden="true" className="size-4 text-muted" /> Log out
            </button>
          </form>
        </li>
      </ul>
    </Disclosure>
  )
}
