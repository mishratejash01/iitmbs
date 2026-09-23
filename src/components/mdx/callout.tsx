import { AlertTriangle, Info, Lightbulb, StickyNote } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils/cn'

const styles = {
  info: { icon: Info, box: 'border-border bg-surface', iconClass: 'text-accent-ink', label: 'Note' },
  tip: { icon: Lightbulb, box: 'border-accent/40 bg-accent-soft', iconClass: 'text-accent-ink', label: 'Tip' },
  warning: { icon: AlertTriangle, box: 'border-warning/30 bg-warning-soft', iconClass: 'text-warning', label: 'Heads up' },
  note: { icon: StickyNote, box: 'border-border bg-card', iconClass: 'text-muted', label: 'Note' },
} as const

export function Callout({ type = 'info', title, children }: { type?: string; title?: string; children?: ReactNode }) {
  const style = styles[(type in styles ? type : 'info') as keyof typeof styles]
  const Icon = style.icon
  return (
    <aside className={cn('flex gap-3 rounded-card border px-4 py-3', style.box)}>
      <Icon aria-hidden="true" className={cn('mt-1 size-5 shrink-0', style.iconClass)} />
      <div className="min-w-0 flex-1 [&>*+*]:mt-2">
        <p className="sr-only">{style.label}:</p>
        {title ? <p className="font-semibold text-text">{title}</p> : null}
        {children}
      </div>
    </aside>
  )
}
