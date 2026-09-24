'use client'

import { Play } from 'lucide-react'
import { useState } from 'react'

/**
 * Click-to-load YouTube embed: shows the thumbnail and loads the privacy-
 * enhanced player only when asked, so videos never slow the page down.
 */
export function YouTube({
  id,
  title = 'Video',
  start,
}: {
  id?: string
  title?: string
  start?: string
}) {
  const [active, setActive] = useState(false)
  if (!id || !/^[\w-]{11}$/.test(id)) return null
  const startParam = start && /^\d+$/.test(start) ? `&start=${start}` : ''

  return (
    <div className="relative my-6 aspect-video overflow-hidden rounded-card bg-surface">
      {active ? (
        <iframe
          className="absolute inset-0 size-full"
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0${startParam}`}
          title={title}
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setActive(true)}
          className="group absolute inset-0 flex items-center justify-center"
          aria-label={`Play video: ${title}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- YouTube thumbnails are external and lazy */}
          <img
            src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 size-full object-cover"
          />
          <span className="relative flex size-16 items-center justify-center rounded-full bg-accent-strong text-on-accent transition-colors group-hover:bg-accent-hover">
            <Play aria-hidden="true" className="ml-1 size-7" />
          </span>
        </button>
      )}
    </div>
  )
}
