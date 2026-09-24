'use client'

import { usePathname } from 'next/navigation'
import { useId, useState } from 'react'

import { Button } from '@/components/ui/button'
import { track } from '@/lib/analytics/client'

type State = 'idle' | 'commenting' | 'sending' | 'done' | 'error'

export function FeedbackWidget({
  pageType,
  entityId,
}: {
  pageType: string
  entityId?: string | null
}) {
  const pathname = usePathname()
  const commentId = useId()
  const [helpful, setHelpful] = useState<boolean | null>(null)
  const [comment, setComment] = useState('')
  const [state, setState] = useState<State>('idle')

  const submit = async (value: boolean, text?: string) => {
    setState('sending')
    track('feedback_helpful', { helpful: value, has_comment: Boolean(text) })
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: pathname,
          page_type: pageType,
          entity_id: entityId ?? null,
          helpful: value,
          comment: text || null,
        }),
      })
      setState(res.ok ? 'done' : 'error')
    } catch {
      setState('error')
    }
  }

  if (state === 'done') {
    return (
      <p role="status" className="rounded-card bg-surface px-5 py-4 text-small text-text">
        Thanks, your feedback helps us decide what to improve next.
      </p>
    )
  }

  return (
    <section aria-label="Page feedback" className="rounded-card bg-surface p-5" data-print="hide">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-medium text-text">Was this page helpful?</p>
        <div className="flex gap-2">
          {[true, false].map((value) => (
            <Button
              key={String(value)}
              variant={helpful === value ? 'primary' : 'secondary'}
              size="sm"
              className="min-w-16"
              aria-pressed={helpful === value}
              onClick={() => {
                setHelpful(value)
                setState('commenting')
              }}
            >
              {value ? 'Yes' : 'No'}
            </Button>
          ))}
        </div>
      </div>
      {state === 'commenting' || state === 'sending' || state === 'error' ? (
        <form
          className="mt-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (helpful !== null) void submit(helpful, comment.trim())
          }}
        >
          <label htmlFor={commentId} className="text-small text-muted">
            {helpful ? 'What helped most? (optional)' : 'What was missing or wrong? (optional)'}
          </label>
          <textarea
            id={commentId}
            value={comment}
            onChange={(event) => setComment(event.target.value.slice(0, 1000))}
            rows={3}
            className="mt-1 w-full rounded-control border border-border-strong bg-card p-3 text-body text-text focus-visible:border-accent-strong"
          />
          <div className="mt-2 flex items-center gap-3">
            <Button type="submit" size="sm" disabled={state === 'sending'}>
              {state === 'sending' ? 'Sending…' : 'Send feedback'}
            </Button>
            {state === 'error' ? (
              <span className="text-small text-danger">Couldn’t send. Please try again.</span>
            ) : null}
          </div>
        </form>
      ) : null}
    </section>
  )
}
