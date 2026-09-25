import { ArrowRight, Search } from 'lucide-react'
import Link from 'next/link'

import { PageContext } from '@/components/analytics/page-context'
import { Button } from '@/components/ui/button'
import { getLectureCourses } from '@/lib/data/lectures'
import { getLinkIndex } from '@/lib/data/links'
import { getPyqCourses } from '@/lib/data/question-papers'
import { getSiteSettings } from '@/lib/data/settings'
import { getNoteCourses } from '@/lib/data/student-notes'
import { LECTURES_PATH, NOTES_PATH, PYQ_PATH } from '@/lib/routes'
import { cn } from '@/lib/utils/cn'

import { LostTicketIllustration } from './lost-ticket-illustration'

const count = (value: number) => value.toLocaleString('en-IN')

/**
 * The 404 page's body: the lost hall ticket, a search box, the parts of the
 * site students use most (with live counts) and the popular pages. Used by
 * both not-found files, inside the site header and footer.
 */
export async function NotFoundContent() {
  const [settings, linkIndex, pyqs, lectures, notes] = await Promise.all([
    getSiteSettings(),
    getLinkIndex(),
    getPyqCourses(),
    getLectureCourses(),
    getNoteCourses(),
  ])
  const popular = settings.home.popular_paths.flatMap((path) => {
    const entry = linkIndex[path]
    return entry ? [{ path, title: entry.title }] : []
  })
  const papers = pyqs.reduce((sum, course) => sum + course.paperCount, 0)
  const videos = lectures.reduce((sum, course) => sum + course.videoCount, 0)
  const noteCount = notes.reduce((sum, course) => sum + course.noteCount, 0)

  const tiles = [
    {
      href: PYQ_PATH,
      value: papers > 0 ? count(papers) : null,
      label: 'previous year papers',
      tone: 'bg-violet/35',
    },
    {
      href: LECTURES_PATH,
      value: videos > 0 ? count(videos) : null,
      label: 'official IIT Madras lectures',
      tone: 'bg-sky/35',
    },
    {
      href: NOTES_PATH,
      value: noteCount > 0 ? count(noteCount) : null,
      label: 'student notes',
      tone: 'bg-lime/45',
    },
    {
      href: '/qualifier',
      value: 'Qualifier',
      label: 'cut-offs, syllabus and dates',
      tone: 'bg-sun/35',
    },
  ].filter((tile) => tile.value !== null)

  return (
    <>
      <PageContext type="404" />
      <section className="container-page grid items-center gap-10 pt-10 pb-12 sm:pt-14 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-16 lg:pb-16">
        <div>
          <p className="text-small font-bold tracking-[0.12em] text-accent-ink uppercase">
            Error 404
          </p>
          <h1 className="mt-3 max-w-2xl text-[2.25rem] leading-[2.75rem] font-bold tracking-tight text-text sm:text-[3.25rem] sm:leading-[3.75rem]">
            This page isn’t in the syllabus
          </h1>
          <p className="mt-4 max-w-xl text-body text-muted">
            The link may be old, or the page has moved. Search for what you need, or go where most
            students start.
          </p>

          <form action="/search" role="search" className="mt-8 flex max-w-xl gap-2">
            <label htmlFor="notfound-search" className="sr-only">
              Search the site
            </label>
            <div className="relative flex-1">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted"
              />
              <input
                id="notfound-search"
                name="q"
                type="search"
                enterKeyHint="search"
                placeholder="e.g. stats 1 week 3"
                className="min-h-13 w-full rounded-full border border-border-strong bg-card pr-4 pl-12 text-text placeholder:text-muted focus-visible:border-accent-strong"
              />
            </div>
            <Button type="submit" size="lg" className="min-h-13">
              Search
            </Button>
          </form>
          <p className="mt-4 text-small text-muted">
            Or go back to the{' '}
            <Link
              href="/"
              className="font-semibold text-accent-ink underline decoration-accent-ink/30 underline-offset-4 hover:decoration-accent-ink"
            >
              home page
            </Link>
            .
          </p>
        </div>

        <LostTicketIllustration className="mx-auto w-full max-w-[20rem] lg:max-w-none" />
      </section>

      <section aria-labelledby="where-students-go" className="container-page pb-12">
        <h2
          id="where-students-go"
          className="text-[1.5rem] leading-8 font-bold tracking-tight text-text"
        >
          Where most students go
        </h2>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tiles.map((tile) => (
            <li key={tile.href}>
              <Link
                href={tile.href}
                className={cn(
                  'group flex h-full flex-col rounded-panel p-6 text-text transition-transform hover:-translate-y-0.5',
                  tile.tone,
                )}
                data-track="nav_click"
                data-track-label={`404:${tile.href}`}
              >
                <span className="text-[2rem] leading-10 font-bold tracking-tight tabular-nums">
                  {tile.value}
                </span>
                <span className="mt-1 text-small font-medium text-text/80">{tile.label}</span>
                <span className="mt-6 inline-flex items-center gap-1.5 text-small font-semibold text-accent-strong">
                  Open
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {popular.length > 0 ? (
        <section aria-labelledby="popular-404" className="container-page pb-16 sm:pb-20">
          <h2
            id="popular-404"
            className="text-[1.5rem] leading-8 font-bold tracking-tight text-text"
          >
            Popular right now
          </h2>
          <ul className="mt-5 flex flex-wrap gap-2.5">
            {popular.map((item) => (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className="inline-flex min-h-10 items-center rounded-card border border-border-strong bg-card px-4 py-2 text-small leading-5 font-medium text-text transition-colors hover:border-accent-strong hover:bg-surface"
                  data-track="nav_click"
                  data-track-label={`404_popular:${item.path}`}
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  )
}
