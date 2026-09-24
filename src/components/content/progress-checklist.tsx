'use client'

import { useEffect, useState } from 'react'

import { track } from '@/lib/analytics/client'
import { DISPLAY_COOKIE } from '@/lib/auth/display-cookie'
import { useCookie } from '@/lib/hooks/browser-state'

type Item = { id: string; type: 'week' | 'assignment' | 'note'; label: string }

/** Tick off the week's notes and assignments (signed-in students only). */
export function ProgressChecklist({ items }: { items: Item[] }) {
  const signedIn = useCookie(DISPLAY_COOKIE) !== null
  const [done, setDone] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!signedIn || items.length === 0) return
    let current = true
    fetch(`/api/me/progress?ids=${items.map((i) => i.id).join(',')}`)
      .then((res) => (res.ok ? res.json() : { completed: [] }))
      .then((data: { completed: string[] }) => {
        if (current) setDone(new Set(data.completed))
      })
      .catch(() => undefined)
    return () => {
      current = false
    }
  }, [items, signedIn])

  if (!signedIn || items.length === 0) return null

  const toggle = async (item: Item) => {
    const next = !done.has(item.id)
    setDone((current) => {
      const copy = new Set(current)
      if (next) copy.add(item.id)
      else copy.delete(item.id)
      return copy
    })
    track('progress_toggle', { item_type: item.type, item_id: item.id, done: next })
    await fetch(
      next ? '/api/me/progress' : `/api/me/progress?item_type=${item.type}&item_id=${item.id}`,
      next
        ? {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ item_type: item.type, item_id: item.id }),
          }
        : { method: 'DELETE' },
    ).catch(() => undefined)
  }

  return (
    <section aria-labelledby="progress" className="rounded-card bg-surface p-5">
      <h2 id="progress" className="font-semibold text-text">
        Your progress
      </h2>
      <ul className="mt-2 divide-y divide-border">
        {items.map((item) => {
          const checked = done.has(item.id)
          return (
            <li key={item.id}>
              <button
                type="button"
                role="checkbox"
                aria-checked={checked}
                onClick={() => toggle(item)}
                className="group flex min-h-12 w-full items-center justify-between gap-3 py-2 text-left text-small"
              >
                <span className={checked ? 'text-muted line-through' : 'text-text'}>
                  {item.label}
                </span>
                {/* The state as a word; aria-checked already tells screen readers. */}
                <span
                  aria-hidden="true"
                  className={
                    checked
                      ? 'shrink-0 text-xs font-semibold text-accent-ink'
                      : 'shrink-0 text-xs font-semibold text-muted group-hover:text-accent-ink group-hover:underline'
                  }
                >
                  {checked ? 'Done' : 'Mark done'}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
