'use client'

import { Bookmark, BookmarkCheck } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { readCookie, track } from '@/lib/analytics/client'
import { DISPLAY_COOKIE } from '@/lib/auth/display-cookie'
import { cn } from '@/lib/utils/cn'

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
  const [signedIn, setSignedIn] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!readCookie(DISPLAY_COOKIE)) return
    setSignedIn(true)
    fetch(`/api/me/bookmarks?path=${encodeURIComponent(pathname)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { bookmarked?: boolean } | null) => setBookmarked(Boolean(data?.bookmarked)))
      .catch(() => undefined)
  }, [pathname])

  if (!signedIn) return null

  const toggle = async () => {
    setBusy(true)
    const next = !bookmarked
    try {
      const res = next
        ? await fetch('/api/me/bookmarks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: pathname, title, entity_type: entityType ?? null, entity_id: entityId ?? null }),
          })
        : await fetch(`/api/me/bookmarks?path=${encodeURIComponent(pathname)}`, { method: 'DELETE' })
      if (res.ok) {
        setBookmarked(next)
        track(next ? 'bookmark_add' : 'bookmark_remove', { path: pathname })
      }
    } finally {
      setBusy(false)
    }
  }

  const Icon = bookmarked ? BookmarkCheck : Bookmark
  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={bookmarked}
      className={cn(
        'inline-flex min-h-11 items-center gap-2 rounded-control border px-3 text-small font-medium',
        bookmarked ? 'border-accent bg-accent-soft text-accent-ink' : 'border-border text-text hover:border-accent',
      )}
    >
      <Icon aria-hidden="true" className="size-4" />
      {bookmarked ? 'Bookmarked' : 'Bookmark'}
    </button>
  )
}
