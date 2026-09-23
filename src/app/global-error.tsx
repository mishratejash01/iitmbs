'use client'

import './globals.css'

/**
 * Last-resort error page (the root layout itself failed). It cannot rely on
 * the database, so it uses the default design tokens only.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <head>
        <style>{`:root{--bg:#fff;--surface:#FFF8F2;--card:#fff;--border:#F1E4D8;--text:#1F1F1F;--text-muted:#6B6B6B;--accent-strong:#B4531A;--on-accent:#fff;--focus:#CF6720}`}</style>
      </head>
      <body className="flex min-h-dvh items-center justify-center bg-bg p-6 font-sans text-text">
        <div className="max-w-md text-center">
          <h1 className="text-h2 font-semibold">Something went wrong</h1>
          <p className="mt-2 text-muted">
            We couldn’t load the site just now. Please try again in a moment.
            {error.digest ? (
              <span className="mt-2 block text-xs">Reference: {error.digest}</span>
            ) : null}
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 min-h-11 rounded-control bg-accent-strong px-5 font-medium text-on-accent"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
