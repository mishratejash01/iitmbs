import type { PageSource } from '@/lib/data/pages'

export function SourcesList({ sources }: { sources: PageSource[] }) {
  if (sources.length === 0) return null
  return (
    <section aria-labelledby="sources" className="mt-10 rounded-card border border-border bg-surface px-4 py-4">
      <h2 id="sources" className="text-small font-semibold text-text">
        Official sources
      </h2>
      <ul className="mt-2 space-y-1 text-small">
        {sources.map((source) => (
          <li key={source.url}>
            <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-accent-ink underline underline-offset-2">
              {source.title}
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
