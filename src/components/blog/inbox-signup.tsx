'use client'

import { Mail } from 'lucide-react'
import Link from 'next/link'
import { useId, useState } from 'react'

import { Button } from '@/components/ui/button'
import type { NewsletterSegment } from '@/lib/blog/segment'

const AUDIENCE: Record<NewsletterSegment, string> = {
  qualifier: 'qualifier',
  foundation: 'foundation level',
  diploma: 'diploma level',
  degree: 'degree level',
  general: 'IITM BS',
}

type Status = 'idle' | 'sending' | 'done' | 'invalid' | 'busy' | 'error'

/**
 * "Handpicked for your inbox": an email sign-up inside every article. It
 * sends the article's segment and page, so we know, for example, that a
 * reader who signed up on a qualifier post is preparing for the qualifier.
 */
export function InboxSignup({
  segment,
  sourcePath,
  sourceEntityId,
  sourceCategory,
}: {
  segment: NewsletterSegment
  sourcePath: string
  sourceEntityId?: string
  sourceCategory?: string
}) {
  const inputId = useId()
  const [status, setStatus] = useState<Status>('idle')

  async function subscribe(form: HTMLFormElement) {
    const email = String(new FormData(form).get('email') ?? '').trim()
    setStatus('sending')
    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email,
          segment,
          source_path: sourcePath,
          source_type: 'blog_post',
          source_entity_id: sourceEntityId ?? null,
          source_category: sourceCategory ?? null,
        }),
      })
      if (response.ok) setStatus('done')
      else if (response.status === 400) setStatus('invalid')
      else if (response.status === 429) setStatus('busy')
      else setStatus('error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <aside
      aria-labelledby={`${inputId}-title`}
      className="my-10 bg-accent-soft p-5 sm:p-7"
      data-print="hide"
    >
      <div className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className="hidden size-12 shrink-0 items-center justify-center bg-accent-strong text-lime sm:flex"
        >
          <Mail className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id={`${inputId}-title`} className="text-[1.25rem] leading-7 font-bold text-text">
            Handpicked for your inbox
          </h2>
          <p className="mt-1 text-[0.9375rem] text-text">
            Deadlines, rule changes and new guides for {AUDIENCE[segment]} students, now and then.
          </p>

          {status === 'done' ? (
            <p role="status" className="mt-4 font-semibold text-success">
              You are on the list. Thanks for subscribing.
            </p>
          ) : (
            <form
              className="mt-4 flex flex-col gap-2 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault()
                void subscribe(event.currentTarget)
              }}
            >
              <label htmlFor={inputId} className="sr-only">
                Email address
              </label>
              <input
                id={inputId}
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="min-h-12 flex-1 rounded-control border border-border-strong bg-card px-4 text-base text-text placeholder:text-muted"
              />
              {/* Squared to match the field (the blog sets --radius-control to 0). */}
              <Button
                type="submit"
                size="lg"
                disabled={status === 'sending'}
                className="rounded-control!"
              >
                {status === 'sending' ? 'Subscribing…' : 'Subscribe'}
              </Button>
            </form>
          )}

          {status === 'invalid' || status === 'busy' || status === 'error' ? (
            <p role="alert" className="mt-2 text-small text-danger">
              {status === 'invalid'
                ? 'Please enter a valid email address.'
                : status === 'busy'
                  ? 'Too many tries. Please try again in a while.'
                  : 'Something went wrong. Please try again.'}
            </p>
          ) : null}

          <p className="mt-3 text-xs text-muted">
            No spam. See our{' '}
            <Link href="/privacy" className="underline underline-offset-2 hover:text-text">
              privacy policy
            </Link>
            .
          </p>
        </div>
      </div>
    </aside>
  )
}
