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
        className="flex min-h-11 items-center gap-2 rounded-control text-muted transition-colors group-data-[tone=dark]/header:text-on-accent/80 hover:text-text group-data-[tone=dark]/header:hover:text-on-accent max-xl:size-11 max-xl:justify-center max-sm:hidden xl:w-56 xl:border xl:border-border xl:bg-card xl:px-3 xl:group-data-[tone=dark]/header:border-on-accent/20 xl:group-data-[tone=dark]/header:bg-on-accent/10 xl:hover:border-accent-strong/40 xl:group-data-[tone=dark]/header:hover:border-on-accent/40"
        aria-label="Search"
        aria-keyshortcuts="Control+K Meta+K"
      >
        <Search aria-hidden="true" className="size-5 xl:size-4" />
        <span className="hidden flex-1 text-small xl:inline">Search…</span>
        <kbd className="hidden rounded border border-border bg-card px-1.5 text-xs text-muted group-data-[tone=dark]/header:border-on-accent/20 group-data-[tone=dark]/header:bg-transparent group-data-[tone=dark]/header:text-on-accent/70 xl:inline">
          ⌘K
        </kbd>
      </Link>
      {loaded ? <SearchDialog open={open} onClose={() => setOpen(false)} /> : null}
    </>
  )
}
