import type { PageSource } from '@/lib/data/pages'

export function SourcesList({ sources }: { sources: PageSource[] }) {
  if (sources.length === 0) return null
  return (
    <section aria-labelledby="sources" className="mt-16 border-t border-border pt-6">
      <h2 id="sources" className="text-xs font-semibold tracking-[0.08em] text-muted uppercase">
        Official sources
      </h2>
      <ul className="mt-3 space-y-2 text-small">
        {sources.map((source) => (
          <li key={source.url}>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-ink underline decoration-accent-ink/30 underline-offset-4 hover:decoration-accent-ink"
            >
              {source.title}
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
