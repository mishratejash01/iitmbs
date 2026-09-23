'use client'

import { useActionState } from 'react'

import {
  deleteAccount,
  updateConsent,
  updateProfile,
  type ActionState,
} from '@/app/(public)/dashboard/actions'
import { Button } from '@/components/ui/button'
import { formatTerm } from '@/lib/routes'
import { cn } from '@/lib/utils/cn'

const initial: ActionState = { ok: false, message: null }
const field = 'mt-1 min-h-11 w-full rounded-control border border-border-strong bg-card px-3 text-text focus-visible:border-accent'

function Message({ state }: { state: ActionState }) {
  if (!state.message) return null
  return (
    <p role="status" className={cn('text-small', state.ok ? 'text-success' : 'text-danger')}>
      {state.message}
    </p>
  )
}

export function ProfileForm({
  profile,
  programs,
  terms,
}: {
  profile: { full_name: string | null; program_id: string | null; current_term: string | null; marketing_consent: boolean }
  programs: Array<{ id: string; shortName: string }>
  terms: string[]
}) {
  const [state, action, pending] = useActionState(updateProfile, initial)
  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="full_name" className="text-small font-medium text-text">
          Name
        </label>
        <input id="full_name" name="full_name" defaultValue={profile.full_name ?? ''} required maxLength={120} className={field} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="program_id" className="text-small font-medium text-text">
            Programme
          </label>
          <select id="program_id" name="program_id" defaultValue={profile.program_id ?? programs[0]?.id} className={field}>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.shortName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="current_term" className="text-small font-medium text-text">
            Term
          </label>
          <select id="current_term" name="current_term" defaultValue={profile.current_term ?? terms[1]} className={field}>
            {terms.map((t) => (
              <option key={t} value={t}>
                {formatTerm(t)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <label className="flex items-start gap-3 text-small text-text">
        <input type="checkbox" name="marketing_consent" defaultChecked={profile.marketing_consent} className="mt-1 size-4 accent-[var(--accent-strong)]" />
        Email me when new notes and walkthroughs for my courses are published.
      </label>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Save profile'}
        </Button>
        <Message state={state} />
      </div>
    </form>
  )
}

export function ConsentForm({ detailed }: { detailed: boolean }) {
  const [state, action, pending] = useActionState(updateConsent, initial)
  return (
    <form action={action} className="space-y-3">
      <label className="flex items-start gap-3 rounded-control border border-border px-4 py-3 has-[:checked]:border-accent">
        <input type="radio" name="level" value="essential" defaultChecked={!detailed} className="mt-1 size-4 accent-[var(--accent-strong)]" />
        <span>
          <span className="block font-medium text-text">Essential only</span>
          <span className="block text-small text-muted">Pseudonymous page statistics. Nothing linked to your account.</span>
        </span>
      </label>
      <label className="flex items-start gap-3 rounded-control border border-border px-4 py-3 has-[:checked]:border-accent">
        <input type="radio" name="level" value="detailed" defaultChecked={detailed} className="mt-1 size-4 accent-[var(--accent-strong)]" />
        <span>
          <span className="block font-medium text-text">Detailed</span>
          <span className="block text-small text-muted">Links activity to your account to power history and progress.</span>
        </span>
      </label>
      <label className="flex items-start gap-3 text-small text-text">
        <input type="checkbox" name="adult" defaultChecked={detailed} className="mt-1 size-4 accent-[var(--accent-strong)]" />
        I am 18 or older (required for detailed analytics).
      </label>
      <div className="flex items-center gap-3">
        <Button type="submit" variant="secondary" disabled={pending}>
          Save choice
        </Button>
        <Message state={state} />
      </div>
    </form>
  )
}

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState(deleteAccount, initial)
  return (
    <form action={action} className="space-y-3">
      <label htmlFor="confirm" className="block text-small text-text">
        Type <span className="font-mono font-semibold">DELETE</span> to permanently delete your account, bookmarks, history,
        progress and all analytics linked to you.
      </label>
      <input id="confirm" name="confirm" autoComplete="off" className={cn(field, 'max-w-xs')} />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 rounded-control bg-danger px-4 font-medium text-white hover:brightness-95 disabled:opacity-60"
        >
          {pending ? 'Deleting…' : 'Delete my account'}
        </button>
        <Message state={state} />
      </div>
    </form>
  )
}
