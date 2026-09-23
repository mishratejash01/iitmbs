import type { Metadata } from 'next'

import { ButtonLink } from '@/components/ui/button'

export const metadata: Metadata = { title: 'You are offline', robots: { index: false } }

/** Served by the service worker when a page isn't available offline. */
export default function OfflinePage() {
  return (
    <div className="container-page py-16">
      <div className="container-reading">
        <h1 className="text-h1 font-semibold text-text">You’re offline</h1>
        <p className="mt-3 text-muted">
          This page isn’t saved on your device yet. Notes you have opened recently are available
          offline — go back or try again when you’re connected.
        </p>
        <div className="mt-6">
          <ButtonLink href="/">Go to the home page</ButtonLink>
        </div>
      </div>
    </div>
  )
}
