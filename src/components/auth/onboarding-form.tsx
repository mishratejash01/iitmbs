'use client'

import { useActionState } from 'react'

import { completeOnboarding, type OnboardingState } from '@/app/(auth)/onboarding/actions'
import { Button } from '@/components/ui/button'
import { formatTerm } from '@/lib/routes'

export function OnboardingForm({
  programs,
  terms,
  defaultTerm,
  next,
}: {
  programs: Array<{ id: string; name: string; shortName: string }>
  terms: string[]
  defaultTerm: string | null
  next: string
}) {
  const [state, action, pending] = useActionState<OnboardingState, FormData>(completeOnboarding, { error: null })

  return (
    <form action={action} className="mt-8 space-y-6">
      <input type="hidden" name="next" value={next} />
      <fieldset>
        <legend className="font-medium text-text">Your programme</legend>
        <div className="mt-3 space-y-2">
          {programs.map((program, index) => (
            <label key={program.id} className="flex cursor-pointer items-center gap-3 rounded-control border border-border px-4 py-3 has-[:checked]:border-accent has-[:checked]:bg-accent-soft">
              <input type="radio" name="program_id" value={program.id} defaultChecked={index === 0} required className="size-4 accent-[var(--accent-strong)]" />
              <span>
                <span className="block font-medium text-text">{program.shortName}</span>
                <span className="block text-small text-muted">{program.name}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="current_term" className="font-medium text-text">
          Your qualifier term
        </label>
        <select
          id="current_term"
          name="current_term"
          defaultValue={defaultTerm ?? terms[1]}
          className="mt-2 min-h-11 w-full rounded-control border border-border-strong bg-card px-3 text-text"
        >
          {terms.map((term) => (
            <option key={term} value={term}>
              {formatTerm(term)}
            </option>
          ))}
        </select>
      </div>

      <label className="flex items-start gap-3 text-small text-text">
        <input type="checkbox" name="marketing_consent" className="mt-1 size-4 accent-[var(--accent-strong)]" />
        Email me when new notes and walkthroughs for my courses are published (optional).
      </label>

      {state.error ? (
        <p role="alert" className="text-small text-danger">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? 'Saving…' : 'Continue'}
      </Button>
    </form>
  )
}
