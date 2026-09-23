'use client'

import { ArrowRight, CornerDownLeft, FileText, Search, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useId, useRef, useState } from 'react'

import { track } from '@/lib/analytics/client'
import { cn } from '@/lib/utils/cn'

import { Highlight } from './highlight'

type Result = { path: string; title: string; subtitle: string | null; snippet: string }
type Response = { searchId: string | null; directHit: { path: string; label: string } | null; results: Result[] }

const RECENT_KEY = 'qh_recent_searches'

function readRecent(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]')
    return Array.isArray(value) ? value.filter((v) => typeof v === 'string').slice(0, 5) : []
  } catch {
    return []
  }
}

function saveRecent(query: string) {
  try {
    const next = [query, ...readRecent().filter((q) => q !== query)].slice(0, 5)
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {
    // Storage unavailable — recent searches are a convenience only.
  }
}

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const listId = useId()
  const [query, setQuery] = useState('')
  const [data, setData] = useState<Response | null>(null)
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(0)
  const [recent, setRecent] = useState<string[]>([])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      setRecent(readRecent())
      requestAnimationFrame(() => inputRef.current?.focus())
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setData(null)
      return
    }
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/search?source=dialog&q=${encodeURIComponent(q)}`, { signal: controller.signal })
        if (!res.ok) {
          track('api_error', { endpoint: '/api/search', status: res.status })
          return
        }
        setData((await res.json()) as Response)
        setActive(0)
      } catch {
        // Aborted or offline: keep the previous results.
      } finally {
        setLoading(false)
      }
    }, 180)
    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [query])

  const items: Array<{ path: string; label: string; subtitle?: string | null; snippet?: string; kind: 'direct' | 'result' }> = [
    ...(data?.directHit ? [{ path: data.directHit.path, label: data.directHit.label, kind: 'direct' as const }] : []),
    ...(data?.results ?? [])
      .filter((r) => r.path !== data?.directHit?.path)
      .map((r) => ({ path: r.path, label: r.title, subtitle: r.subtitle, snippet: r.snippet, kind: 'result' as const })),
  ]

  const go = useCallback(
    (path: string, position: number) => {
      const q = query.trim()
      if (q) saveRecent(q)
      if (data?.searchId) track('search_result_click', { search_id: data.searchId, position, target: path }, { immediate: true })
      onClose()
      router.push(path)
    },
    [data, onClose, query, router],
  )

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((i) => Math.min(i + 1, Math.max(items.length - 1, 0)))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const item = items[active]
      if (item) go(item.path, active + 1)
      else if (query.trim()) {
        onClose()
        router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      }
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose()
      }}
      aria-label="Search the site"
      className="m-0 mx-auto mt-[8vh] w-[calc(100%-2rem)] max-w-xl rounded-card border border-border bg-card p-0 text-text shadow-card backdrop:bg-black/40 backdrop:backdrop-blur-[2px]"
    >
      <div className="flex items-center gap-2 border-b border-border px-3">
        <Search aria-hidden="true" className="size-5 shrink-0 text-muted" />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded={items.length > 0}
          aria-controls={listId}
          aria-activedescendant={items[active] ? `${listId}-${active}` : undefined}
          aria-autocomplete="list"
          placeholder="Try “maths 1 week 2 graded assignment”"
          className="min-h-14 flex-1 bg-transparent text-body outline-none placeholder:text-muted"
          enterKeyHint="search"
        />
        <button
          type="button"
          onClick={onClose}
          className="flex size-10 items-center justify-center rounded-control text-muted hover:bg-surface hover:text-text"
          aria-label="Close search"
        >
          <X aria-hidden="true" className="size-5" />
        </button>
      </div>

      <div className="max-h-[60vh] overflow-y-auto p-2">
        {query.trim().length < 2 ? (
          <div className="px-2 py-3">
            {recent.length > 0 ? (
              <>
                <p className="px-1 pb-2 text-xs font-semibold tracking-wide text-muted uppercase">Recent</p>
                <ul>
                  {recent.map((q) => (
                    <li key={q}>
                      <button
                        type="button"
                        onClick={() => setQuery(q)}
                        className="flex min-h-11 w-full items-center gap-2 rounded-control px-2 text-left text-small hover:bg-surface"
                      >
                        <Search aria-hidden="true" className="size-4 text-muted" />
                        {q}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="px-1 text-small text-muted">
                Search by course, week or topic — for example “stats 1 week 3”, “ct notes” or “eligibility”.
              </p>
            )}
          </div>
        ) : (
          <ul id={listId} role="listbox" aria-label="Search results" aria-busy={loading}>
            {items.map((item, index) => (
              <li
                key={item.path}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === active}
                onMouseEnter={() => setActive(index)}
                onClick={() => go(item.path, index + 1)}
                className={cn(
                  'flex cursor-pointer gap-3 rounded-control px-3 py-2.5',
                  index === active ? 'bg-surface' : '',
                )}
              >
                {item.kind === 'direct' ? (
                  <ArrowRight aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-accent-ink" />
                ) : (
                  <FileText aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-small font-medium text-text">
                    {item.kind === 'direct' ? `Go to ${item.label}` : item.label}
                  </p>
                  {item.subtitle ? <p className="truncate text-xs text-muted">{item.subtitle}</p> : null}
                  {item.snippet ? (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted">
                      <Highlight text={item.snippet} />
                    </p>
                  ) : null}
                </div>
                {index === active ? <CornerDownLeft aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted" /> : null}
              </li>
            ))}
            {!loading && data && items.length === 0 ? (
              <li className="px-3 py-6 text-center text-small text-muted" role="presentation">
                Nothing found for “{query.trim()}”. Try a course name and week number.
              </li>
            ) : null}
          </ul>
        )}
      </div>

      {query.trim().length >= 2 ? (
        <div className="border-t border-border px-3 py-2 text-right">
          <a
            href={`/search?q=${encodeURIComponent(query.trim())}`}
            onClick={(event) => {
              event.preventDefault()
              onClose()
              router.push(`/search?q=${encodeURIComponent(query.trim())}`)
            }}
            className="text-small font-medium text-accent-ink hover:underline"
          >
            See all results
          </a>
        </div>
      ) : null}
    </dialog>
  )
}
