import type { PageSource } from '@/lib/data/pages'
import { describeLink } from '@/lib/links/describe'

import { LinkCard } from './link-card'

/** The official pages a page is based on, as link cards readers can open. */
export function SourcesList({ sources }: { sources: PageSource[] }) {
  if (sources.length === 0) return null
  return (
    <section aria-labelledby="sources" className="mt-14">
      <h2 id="sources" className="text-[1.375rem] leading-8 font-bold text-text">
        Official sources
      </h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {sources.map((source) => {
          const target = describeLink(source.url)
          return (
            <li key={source.url}>
              {target?.kind === 'internal' ? (
                <LinkCard href={target.path} title={source.title} host="" internal />
              ) : (
                <LinkCard
                  href={source.url}
                  title={source.title}
                  host={target?.kind === 'external' ? target.host : source.url}
                  official={target?.kind === 'external' && target.official}
                />
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
