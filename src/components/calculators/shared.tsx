'use client'

import { useId, type ChangeEvent } from 'react'

import type { Category } from '@/lib/qualifier/rules'
import { cn } from '@/lib/utils/cn'

export type CalculatorProgram = { slug: string; name: string; courses: string[] }

export const fieldClasses =
  'w-full rounded-control border border-border-strong bg-card px-3 text-body text-text ' +
  'placeholder:text-muted focus-visible:border-accent min-h-11'

export function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
}) {
  const id = useId()
  return (
    <div className="min-w-0 flex-1">
      <label htmlFor={id} className="mb-1 block text-small font-medium text-text">
        {label}
      </label>
      <select id={id} className={fieldClasses} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

/** 0–100 score input that keeps an empty string while typing. */
export function ScoreInput({
  label,
  value,
  onChange,
  className,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  className?: string
}) {
  const id = useId()
  const handle = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value.replace(/[^0-9.]/g, '').slice(0, 6)
    const numeric = Number(next)
    onChange(next === '' || Number.isNaN(numeric) ? next : String(Math.min(100, numeric)))
  }
  return (
    <>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        inputMode="decimal"
        autoComplete="off"
        placeholder="0"
        value={value}
        onChange={handle}
        className={cn(fieldClasses, 'text-center tabular-nums', className)}
      />
    </>
  )
}

export function categoryOptions(categories: Category[]) {
  return categories.map((c) => ({ value: c.id, label: c.label }))
}

export function Verdict({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'mt-4 rounded-control px-4 py-3 text-small font-medium',
        ok ? 'bg-success-soft text-success' : 'bg-warning-soft text-warning',
      )}
    >
      {children}
    </div>
  )
}
