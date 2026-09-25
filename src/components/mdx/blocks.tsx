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
    <section className="rounded-card bg-surface px-5 py-4" aria-label={title}>
      <p className="text-xs font-semibold tracking-wide text-accent-ink uppercase">{title}</p>
      <div className="mt-1.5 [&>*+*]:mt-2">{children}</div>
    </section>
  )
}

/** Numbered steps: wrap an ordered list to get step styling (plain teal numbers between hairlines). */
export function Steps({ children }: { children?: ReactNode }) {
  return (
    <div className="[&_ol]:list-none [&_ol]:border-t [&_ol]:border-border [&_ol]:pl-0 [&_ol]:[counter-reset:step] [&_ol>li]:relative [&_ol>li]:border-b [&_ol>li]:border-border [&_ol>li]:py-3 [&_ol>li]:pl-9 [&_ol>li]:[counter-increment:step] [&_ol>li]:before:absolute [&_ol>li]:before:top-3 [&_ol>li]:before:left-0 [&_ol>li]:before:font-semibold [&_ol>li]:before:text-accent-ink [&_ol>li]:before:tabular-nums [&_ol>li]:before:content-[counter(step)] [&_ol>li+li]:mt-0">
      {children}
    </div>
  )
}

/** A term and its definition. */
export function Definition({ term, children }: { term?: string; children?: ReactNode }) {
  return (
    <dl className="rounded-card bg-surface px-5 py-4">
      {term ? <dt className="font-semibold text-text">{term}</dt> : null}
      <dd className="mt-1 [&>*+*]:mt-2">{children}</dd>
    </dl>
  )
}
