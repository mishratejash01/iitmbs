import { Fragment } from 'react'

/**
 * Renders a search snippet whose matches are wrapped in U+0002 … U+0003
 * (set by the database) as <mark> elements — no HTML from the server.
 */
export function Highlight({ text }: { text: string }) {
  const parts = text.split(/(\u0002[^\u0003]*\u0003)/g)
  return (
    <>
      {parts.map((part, index) =>
        part.startsWith('\u0002') ? (
          <mark key={index} className="rounded-sm bg-accent-soft px-0.5 text-text">
            {part.slice(1, -1)}
          </mark>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </>
  )
}
