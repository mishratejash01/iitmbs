'use client'

import { Search } from 'lucide-react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useEffect, useState } from 'react'

// The dialog (and its code) loads only when someone opens search.
const SearchDialog = dynamic(() => import('./search-dialog').then((m) => m.SearchDialog), {
  ssr: false,
})

export function SearchTrigger() {
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setLoaded(true)
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      {/* Without JavaScript this is a plain link to the search page. */}
      <Link
        href="/search"
        prefetch={false}
        onClick={(event) => {
          event.preventDefault()
          setLoaded(true)
          setOpen(true)
        }}
        onPointerEnter={() => setLoaded(true)}
        className="flex min-h-11 items-center gap-2 rounded-control text-muted transition-colors hover:text-text max-md:size-11 max-md:justify-center md:w-56 md:border md:border-border md:bg-surface md:px-3 md:hover:border-border-strong"
        aria-label="Search"
        aria-keyshortcuts="Control+K Meta+K"
      >
        <Search aria-hidden="true" className="size-5 md:size-4" />
        <span className="hidden flex-1 text-small md:inline">Search…</span>
        <kbd className="hidden rounded border border-border bg-card px-1.5 text-xs text-muted md:inline">
          ⌘K
        </kbd>
      </Link>
      {loaded ? <SearchDialog open={open} onClose={() => setOpen(false)} /> : null}
    </>
  )
}
