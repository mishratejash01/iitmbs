'use client'

import { Play } from 'lucide-react'
import { useRef, useState, useSyncExternalStore } from 'react'

import { cn } from '@/lib/utils/cn'

export type PlayerLecture = {
  youtubeId: string
  title: string
  /** "5A"; null for videos without a number. */
  lecture: string | null
  duration: string | null
}

const label = (lecture: PlayerLecture, index: number) =>
  lecture.lecture !== null ? `Lecture ${lecture.lecture}` : `Video ${index + 1}`

/**
 * One week's lectures: a click-to-play YouTube player (privacy-enhanced; the
 * player loads only when asked) and the list beside it. Choosing a lecture
 * plays it here; the choice is kept in the address (?lecture=5A) for sharing.
 */
// The lecture asked for in the address; null on the server and before hydration.
const subscribeNever = () => () => {}
const readWanted = () => new URLSearchParams(window.location.search).get('lecture')

export function LecturePlayer({ lectures }: { lectures: PlayerLecture[] }) {
  const wanted = useSyncExternalStore(subscribeNever, readWanted, () => null)
  const [chosen, setChosen] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)
  const playerRef = useRef<HTMLDivElement>(null)

  if (lectures.length === 0) return null
  const linked = wanted
    ? lectures.findIndex((l) => l.lecture !== null && l.lecture === wanted.toUpperCase())
    : -1
  const index = chosen ?? (linked >= 0 ? linked : 0)
  const current = lectures[index] ?? lectures[0]!

  const choose = (next: number) => {
    setChosen(next)
    setPlaying(true)
    const lecture = lectures[next]?.lecture
    const url = new URL(window.location.href)
    if (lecture) url.searchParams.set('lecture', lecture)
    else url.searchParams.delete('lecture')
    window.history.replaceState(null, '', url)
    // On phones the list sits below the player: bring the player back into view.
    if (window.matchMedia('(max-width: 1023px)').matches) {
      playerRef.current?.scrollIntoView({ block: 'start' })
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-10">
      <div className="min-w-0">
        <div
          ref={playerRef}
          className="relative aspect-video scroll-mt-24 overflow-hidden rounded-card bg-accent-strong"
        >
          {playing ? (
            <iframe
              key={current.youtubeId}
              className="absolute inset-0 size-full"
              src={`https://www.youtube-nocookie.com/embed/${current.youtubeId}?autoplay=1&rel=0`}
              title={current.title}
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <button
              type="button"
              onClick={() => choose(index)}
              className="group absolute inset-0 flex items-center justify-center"
              aria-label={`Play ${label(current, index)}: ${current.title}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- YouTube thumbnails are external */}
              <img
                src={`https://i.ytimg.com/vi/${current.youtubeId}/hqdefault.jpg`}
                alt=""
                decoding="async"
                className="absolute inset-0 size-full object-cover opacity-90"
              />
              <span className="relative flex size-16 items-center justify-center rounded-full bg-accent-strong text-on-accent transition-colors group-hover:bg-accent-hover">
                <Play aria-hidden="true" className="ml-1 size-7" />
              </span>
            </button>
          )}
        </div>
        <div className="mt-5">
          <p className="text-xs font-semibold tracking-[0.08em] text-accent-ink uppercase">
            {label(current, index)}
            {current.duration ? ` · ${current.duration}` : ''}
          </p>
          <h2 className="mt-1.5 text-h3 font-semibold text-text sm:text-h2">{current.title}</h2>
          <a
            href={`https://www.youtube.com/watch?v=${current.youtubeId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-small font-semibold text-accent-ink underline decoration-accent-ink/30 underline-offset-4 hover:decoration-accent-ink"
          >
            Watch on YouTube
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      </div>

      <ol
        aria-label="Lectures this week"
        className="border-t border-border lg:max-h-[34rem] lg:overflow-y-auto"
      >
        {lectures.map((lecture, i) => {
          const active = i === index
          return (
            <li key={lecture.youtubeId} className="border-b border-border">
              <button
                type="button"
                onClick={() => choose(i)}
                aria-current={active ? 'true' : undefined}
                className={cn(
                  'grid w-full grid-cols-[3.25rem_1fr] gap-x-3 border-l-2 py-3.5 pr-2 pl-3 text-left transition-colors',
                  active
                    ? 'border-accent-strong bg-surface'
                    : 'border-transparent hover:bg-surface/60',
                )}
              >
                <span className="pt-0.5 text-small font-semibold text-accent-ink tabular-nums">
                  {lecture.lecture ?? i + 1}
                </span>
                <span className="min-w-0">
                  <span
                    className={cn(
                      'block text-small leading-6',
                      active ? 'font-semibold text-text' : 'font-medium text-text',
                    )}
                  >
                    {lecture.title}
                  </span>
                  {lecture.duration ? (
                    <span className="mt-0.5 block text-xs text-muted tabular-nums">
                      {lecture.duration}
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
