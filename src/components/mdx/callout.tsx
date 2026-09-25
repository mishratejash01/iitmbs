import type { ReactNode } from 'react'

// No icons and no side rules: a soft panel with a small uppercase label.
const styles = {
  info: { box: 'rounded-card bg-surface px-5 py-4', label: 'Note' },
  tip: { box: 'rounded-card bg-accent-soft px-5 py-4', label: 'Tip' },
  warning: { box: 'rounded-card bg-sun/25 px-5 py-4', label: 'Heads up' },
  note: { box: 'rounded-card bg-surface px-5 py-4', label: 'Note' },
} as const

export function Callout({
  type = 'info',
  title,
  children,
}: {
  type?: string
  title?: string
  children?: ReactNode
}) {
  const style = styles[(type in styles ? type : 'info') as keyof typeof styles]
  return (
    <aside className={style.box}>
      {/* Visual label; screen readers get the sr-only one inside the body. */}
      <p
        aria-hidden="true"
        className="text-xs font-semibold tracking-wide text-accent-ink uppercase"
      >
        {style.label}
      </p>
      <div className="mt-1.5 min-w-0 [&>*+*]:mt-2">
        <p className="sr-only">{style.label}:</p>
        {title ? <p className="font-semibold text-text">{title}</p> : null}
        {children}
      </div>
    </aside>
  )
}
