import { ArrowRight, Search } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { after } from 'next/server'
import { Suspense } from 'react'

import { PageContext } from '@/components/analytics/page-context'
import { Highlight } from '@/components/search/highlight'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { SkeletonText } from '@/components/ui/skeleton'
import { recordSearch } from '@/lib/analytics/server'
import { searchSite } from '@/lib/data/search'
import { getSiteSettings } from '@/lib/data/settings'
import { privateMetadata } from '@/lib/seo/metadata'

export async function generateMetadata(): Promise<Metadata> {
  // Search results are never indexed.
  return privateMetadata('Search', await getSiteSettings())
}

async function Results({ searchParams }: Pick<PageProps<'/search'>, 'searchParams'>) {
  const raw = (await searchParams).q
  const query = (Array.isArray(raw) ? raw[0] : raw)?.trim().slice(0, 200) ?? ''

  if (query.length < 2) {
    return <p className="text-muted">Type at least two characters — for example “maths 1 week 2” or “eligibility”.</p>
  }

  const response = await searchSite(query, 30)
  const searchId = crypto.randomUUID()
  after(() =>
    recordSearch({
      id: searchId,
      query,
      normalized: response.parsed.normalized,
      resultsCount: response.results.length,
      source: 'page',
      parsed: {
        text: response.parsed.text,
        week: response.parsed.week,
        kind: response.parsed.kind,
        course: response.parsed.course?.slug ?? null,
      },
    }),
  )

  return (
    <div className="space-y-6">
      {response.directHit ? (
        <Link
          href={response.directHit.path}
          className="flex items-center justify-between gap-3 rounded-card border border-accent/40 bg-accent-soft px-4 py-3 font-medium text-accent-ink"
          data-track="search_result_click"
          data-track-search-id={searchId}
          data-track-position="0"
          data-track-target={response.directHit.path}
        >
          Go to {response.directHit.label}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      ) : null}

      <p className="text-small text-muted" role="status">
        {response.results.length === 0
          ? `No results for “${query}”.`
          : `${response.results.length} result${response.results.length === 1 ? '' : 's'} for “${query}”`}
      </p>

      {response.results.length === 0 ? (
        <EmptyState
          icon={<Search className="size-5" />}
          title="Nothing matched"
          description="Try the course name with a week number (“stats 1 week 3”) or a topic (“quartiles”)."
        />
      ) : (
        <ol className="divide-y divide-border rounded-card border border-border bg-card">
          {response.results.map((result, index) => (
            <li key={result.path}>
              <Link
                href={result.path}
                className="block px-4 py-4 hover:bg-surface"
                data-track="search_result_click"
                data-track-search-id={searchId}
                data-track-position={index + 1}
                data-track-target={result.path}
              >
                <span className="block font-medium text-text">{result.title}</span>
                {result.subtitle ? <span className="block text-xs text-muted">{result.subtitle}</span> : null}
                {result.snippet ? (
                  <span className="mt-1 line-clamp-2 block text-small text-muted">
                    <Highlight text={result.snippet} />
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

async function SearchBox({ searchParams }: Pick<PageProps<'/search'>, 'searchParams'>) {
  const raw = (await searchParams).q
  const query = (Array.isArray(raw) ? raw[0] : raw) ?? ''
  return (
    <form action="/search" role="search" className="flex gap-2">
      <label htmlFor="search-q" className="sr-only">
        Search
      </label>
      <input
        id="search-q"
        name="q"
        type="search"
        defaultValue={query}
        enterKeyHint="search"
        placeholder="Search courses, weeks and topics"
        className="min-h-12 flex-1 rounded-control border border-border-strong bg-card px-3 text-text placeholder:text-muted focus-visible:border-accent"
      />
      <Button type="submit" size="lg">
        Search
      </Button>
    </form>
  )
}

export default function SearchPage({ searchParams }: PageProps<'/search'>) {
  return (
    <>
      <PageContext type="search" />
      <div className="container-page py-8 sm:py-10">
        <div className="container-reading">
          <h1 className="text-h2 font-semibold sm:text-h1">Search</h1>
          <div className="mt-4">
            <Suspense fallback={<div className="min-h-12 rounded-control border border-border bg-card" />}>
              <SearchBox searchParams={searchParams} />
            </Suspense>
          </div>
          <div className="mt-8">
            <Suspense fallback={<SkeletonText lines={6} />}>
              <Results searchParams={searchParams} />
            </Suspense>
          </div>
        </div>
      </div>
    </>
  )
}
