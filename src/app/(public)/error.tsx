'use client'

import { useEffect } from 'react'

import { Button, ButtonLink } from '@/components/ui/button'
import { track } from '@/lib/analytics/client'

export default function PublicError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    track('js_error', { message: error.message.slice(0, 200), source: `boundary:${error.digest ?? 'none'}` })
  }, [error])

  return (
    <div className="container-page py-16">
      <div className="container-reading">
        <p className="text-small font-semibold text-accent-ink">Something went wrong</p>
        <h1 className="mt-2 text-h1 font-semibold text-text">This page didn’t load properly</h1>
        <p className="mt-3 text-muted">
          It’s probably temporary. Try again, or head back to the home page.
          {error.digest ? <span className="mt-2 block text-xs">Reference: {error.digest}</span> : null}
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button onClick={reset}>Try again</Button>
          <ButtonLink href="/" variant="secondary">
            Go home
          </ButtonLink>
        </div>
      </div>
    </div>
  )
}
