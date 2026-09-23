'use client'

import { CheckCircle2, XCircle } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { cn } from '@/lib/utils/cn'

type Option = { id: string; letter: string; label: ReactNode }

/**
 * Lets students try a released question before opening the walkthrough.
 * Only rendered after release, so the answer key is already public.
 */
export function ChoiceChecker({
  questionId,
  multiple,
  options,
  correct,
}: {
  questionId: string
  multiple: boolean
  options: Option[]
  correct: string[]
}) {
  const [selected, setSelected] = useState<string[]>([])
  const [checked, setChecked] = useState(false)
  const isRight =
    checked && selected.length === correct.length && selected.every((id) => correct.includes(id))

  const toggle = (id: string) => {
    setChecked(false)
    setSelected((current) =>
      multiple ? (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]) : [id],
    )
  }

  return (
    <fieldset className="mt-4">
      <legend className="sr-only">{multiple ? 'Select all that apply' : 'Select one answer'}</legend>
      <ul className="space-y-2">
        {options.map((option) => {
          const chosen = selected.includes(option.id)
          const state = checked ? (correct.includes(option.id) ? 'right' : chosen ? 'wrong' : 'idle') : chosen ? 'chosen' : 'idle'
          return (
            <li key={option.id}>
              <label
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-control border px-3 py-2.5',
                  state === 'right' && 'border-success bg-success-soft',
                  state === 'wrong' && 'border-danger bg-danger-soft',
                  state === 'chosen' && 'border-accent bg-accent-soft',
                  state === 'idle' && 'border-border hover:border-border-strong',
                )}
              >
                <input
                  type={multiple ? 'checkbox' : 'radio'}
                  name={`q-${questionId}`}
                  checked={chosen}
                  onChange={() => toggle(option.id)}
                  className="mt-1.5 size-4 accent-[var(--accent-strong)]"
                />
                <span className="font-semibold text-muted">{option.letter}.</span>
                <span className="min-w-0 flex-1 [&_p]:m-0">{option.label}</span>
              </label>
            </li>
          )
        })}
      </ul>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={selected.length === 0}
          onClick={() => setChecked(true)}
          className="min-h-11 rounded-control border border-border-strong px-4 text-small font-medium text-text hover:border-accent disabled:opacity-50"
        >
          Check my answer
        </button>
        {checked ? (
          <p role="status" className={cn('inline-flex items-center gap-1.5 text-small font-medium', isRight ? 'text-success' : 'text-danger')}>
            {isRight ? <CheckCircle2 aria-hidden="true" className="size-4" /> : <XCircle aria-hidden="true" className="size-4" />}
            {isRight ? 'Correct!' : 'Not quite — compare with the walkthrough below.'}
          </p>
        ) : null}
      </div>
    </fieldset>
  )
}
