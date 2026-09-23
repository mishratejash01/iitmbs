'use client'

import { ThumbsDown, ThumbsUp } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useId, useState } from 'react'

import { Button } from '@/components/ui/button'
import { track } from '@/lib/analytics/client'
import { cn } from '@/lib/utils/cn'

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
      <p
        role="status"
        className="rounded-card border border-border bg-surface px-4 py-3 text-small text-text"
      >
        Thanks — your feedback helps us decide what to improve next.
      </p>
    )
  }

  return (
    <section
      aria-label="Page feedback"
      className="rounded-card border border-border bg-card px-4 py-4"
      data-print="hide"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-medium text-text">Was this page helpful?</p>
        <div className="flex gap-2">
          {[true, false].map((value) => {
            const Icon = value ? ThumbsUp : ThumbsDown
            return (
              <button
                key={String(value)}
                type="button"
                aria-pressed={helpful === value}
                onClick={() => {
                  setHelpful(value)
                  setState('commenting')
                }}
                className={cn(
                  'inline-flex min-h-11 items-center gap-2 rounded-control border px-4 text-small font-medium',
                  helpful === value
                    ? 'border-accent bg-accent-soft text-accent-ink'
                    : 'border-border text-text hover:border-accent',
                )}
              >
                <Icon aria-hidden="true" className="size-4" />
                {value ? 'Yes' : 'No'}
              </button>
            )
          })}
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
            className="mt-1 w-full rounded-control border border-border-strong bg-card p-3 text-body text-text focus-visible:border-accent"
          />
          <div className="mt-2 flex items-center gap-3">
            <Button type="submit" size="sm" disabled={state === 'sending'}>
              {state === 'sending' ? 'Sending…' : 'Send feedback'}
            </Button>
            {state === 'error' ? (
              <span className="text-small text-danger">Couldn’t send — please try again.</span>
            ) : null}
          </div>
        </form>
      ) : null}
    </section>
  )
}
