'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils/cn'

/**
 * A row of cards that scrolls sideways, with round previous/next buttons
 * next to the title. Without JavaScript it is still a scrollable row.
 */
export function RelatedCarousel({
  id,
  title,
  items,
}: {
  id: string
  title: string
  items: Array<{ key: string; node: ReactNode }>
}) {
  const track = useRef<HTMLUListElement>(null)
  const [edges, setEdges] = useState({ start: true, end: false })

  const update = useCallback(() => {
    const el = track.current
    if (!el) return
    setEdges({
      start: el.scrollLeft <= 4,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
    })
  }, [])

  useEffect(() => {
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [update])

  const scroll = (direction: 1 | -1) =>
    track.current?.scrollBy({ left: direction * track.current.clientWidth, behavior: 'smooth' })

  const button = (disabled: boolean) =>
    cn(
      'flex size-11 items-center justify-center rounded-full text-on-accent transition-colors',
      disabled ? 'bg-accent-strong/35' : 'bg-accent-strong hover:bg-accent-hover',
    )

  return (
    <section aria-labelledby={id}>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2
          id={id}
          className="text-[1.5rem] leading-9 font-bold text-text sm:text-[1.75rem] sm:leading-[2.625rem]"
        >
          {title}
        </h2>
        <div className="flex gap-3" data-print="hide">
          <button
            type="button"
            onClick={() => scroll(-1)}
            disabled={edges.start}
            aria-label="Previous articles"
            className={button(edges.start)}
          >
            <ChevronLeft aria-hidden="true" className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            disabled={edges.end}
            aria-label="Next articles"
            className={button(edges.end)}
          >
            <ChevronRight aria-hidden="true" className="size-5" />
          </button>
        </div>
      </div>
      <ul
        ref={track}
        onScroll={update}
        aria-label={title}
        className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth"
      >
        {items.map((item) => (
          <li
            key={item.key}
            className="w-[85%] shrink-0 snap-start sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-2rem)/3)]"
          >
            {item.node}
          </li>
        ))}
      </ul>
    </section>
  )
}
