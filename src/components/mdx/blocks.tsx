import type { ReactNode } from 'react'

/** A highlighted "remember this" block. */
export function KeyIdea({
  title = 'Key idea',
  children,
}: {
  title?: string
  children?: ReactNode
}) {
  return (
    <section
      className="rounded-card border-l-4 border-accent bg-surface px-4 py-3"
      aria-label={title}
    >
      <p className="text-small font-semibold tracking-wide text-accent-ink uppercase">{title}</p>
      <div className="mt-1 [&>*+*]:mt-2">{children}</div>
    </section>
  )
}

/** Numbered steps: wrap an ordered list to get step styling. */
export function Steps({ children }: { children?: ReactNode }) {
  return (
    <div className="rounded-card border border-border px-4 py-3 [&_ol]:list-none [&_ol]:pl-0 [&_ol]:[counter-reset:step] [&_ol>li]:relative [&_ol>li]:pl-9 [&_ol>li]:[counter-increment:step] [&_ol>li]:before:absolute [&_ol>li]:before:left-0 [&_ol>li]:before:flex [&_ol>li]:before:size-6 [&_ol>li]:before:items-center [&_ol>li]:before:justify-center [&_ol>li]:before:rounded-full [&_ol>li]:before:bg-accent-soft [&_ol>li]:before:text-xs [&_ol>li]:before:font-semibold [&_ol>li]:before:text-accent-ink [&_ol>li]:before:content-[counter(step)]">
      {children}
    </div>
  )
}

/** A term and its definition. */
export function Definition({ term, children }: { term?: string; children?: ReactNode }) {
  return (
    <dl className="rounded-card border border-border px-4 py-3">
      {term ? <dt className="font-semibold text-text">{term}</dt> : null}
      <dd className="mt-1 [&>*+*]:mt-2">{children}</dd>
    </dl>
  )
}
