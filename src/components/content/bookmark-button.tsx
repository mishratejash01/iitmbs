'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { buttonClasses } from '@/components/ui/button'
import { track } from '@/lib/analytics/client'
import { DISPLAY_COOKIE } from '@/lib/auth/display-cookie'
import { useCookie } from '@/lib/hooks/browser-state'

/**
 * Bookmark toggle for signed-in students. Renders nothing for visitors, so
 * static pages stay identical for everyone until hydration.
 */
export function BookmarkButton({
  title,
  entityType,
  entityId,
}: {
  title: string
  entityType?: 'program' | 'course' | 'week' | 'assignment' | 'note' | 'page' | 'resource'
  entityId?: string | null
}) {
  const pathname = usePathname()
  const signedIn = useCookie(DISPLAY_COOKIE) !== null
  // Keyed by path, so a stale answer never shows on the next page.
  const [saved, setSaved] = useState<{ path: string; bookmarked: boolean } | null>(null)
  const bookmarked = saved?.path === pathname && saved.bookmarked
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!signedIn) return
    let current = true
    fetch(`/api/me/bookmarks?path=${encodeURIComponent(pathname)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { bookmarked?: boolean } | null) => {
        if (current) setSaved({ path: pathname, bookmarked: Boolean(data?.bookmarked) })
      })
      .catch(() => undefined)
    return () => {
      current = false
    }
  }, [pathname, signedIn])

  if (!signedIn) return null

  const toggle = async () => {
    setBusy(true)
    const next = !bookmarked
    try {
      const res = next
        ? await fetch('/api/me/bookmarks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              path: pathname,
              title,
              entity_type: entityType ?? null,
              entity_id: entityId ?? null,
            }),
          })
        : await fetch(`/api/me/bookmarks?path=${encodeURIComponent(pathname)}`, {
            method: 'DELETE',
          })
      if (res.ok) {
        setSaved({ path: pathname, bookmarked: next })
        track(next ? 'bookmark_add' : 'bookmark_remove', { path: pathname })
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={bookmarked}
      data-print="hide"
      className={buttonClasses(bookmarked ? 'primary' : 'secondary', 'sm')}
    >
      {bookmarked ? 'Bookmarked' : 'Bookmark'}
    </button>
  )
}
