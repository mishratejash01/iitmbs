'use client'

import { CheckCircle2, Circle } from 'lucide-react'
import { useEffect, useState } from 'react'

import { readCookie, track } from '@/lib/analytics/client'
import { DISPLAY_COOKIE } from '@/lib/auth/display-cookie'
import { cn } from '@/lib/utils/cn'

type Item = { id: string; type: 'week' | 'assignment' | 'note'; label: string }

/** Tick off the week's notes and assignments (signed-in students only). */
export function ProgressChecklist({ items }: { items: Item[] }) {
  const [signedIn, setSignedIn] = useState(false)
  const [done, setDone] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!readCookie(DISPLAY_COOKIE) || items.length === 0) return
    setSignedIn(true)
    fetch(`/api/me/progress?ids=${items.map((i) => i.id).join(',')}`)
      .then((res) => (res.ok ? res.json() : { completed: [] }))
      .then((data: { completed: string[] }) => setDone(new Set(data.completed)))
      .catch(() => undefined)
  }, [items])

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
        ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ item_type: item.type, item_id: item.id }) }
        : { method: 'DELETE' },
    ).catch(() => undefined)
  }

  return (
    <section aria-labelledby="progress" className="rounded-card border border-border bg-card p-4">
      <h2 id="progress" className="font-semibold text-text">
        Your progress
      </h2>
      <ul className="mt-2">
        {items.map((item) => {
          const checked = done.has(item.id)
          const Icon = checked ? CheckCircle2 : Circle
          return (
            <li key={item.id}>
              <button
                type="button"
                role="checkbox"
                aria-checked={checked}
                onClick={() => toggle(item)}
                className="flex min-h-11 w-full items-center gap-2 rounded-control px-2 text-left text-small hover:bg-surface"
              >
                <Icon aria-hidden="true" className={cn('size-5', checked ? 'text-success' : 'text-muted')} />
                <span className={checked ? 'text-muted line-through' : 'text-text'}>{item.label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
