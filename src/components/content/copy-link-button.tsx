'use client'

import { useState, useSyncExternalStore } from 'react'

import { track } from '@/lib/analytics/client'

const subscribeNever = () => () => {}
const canShare = () => typeof navigator.share === 'function'

/** Native share sheet on phones, copy-to-clipboard elsewhere. */
export function CopyLinkButton({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false)
  // False on the server, so the first client render matches the static HTML.
  const share = useSyncExternalStore(subscribeNever, canShare, () => false)
  const onClick = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ url, title })
        track('share_click', { channel: 'native' })
        return
      } catch {
        // Share sheet dismissed: fall back to copying.
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      track('share_click', { channel: 'copy' })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-11 items-center font-semibold text-accent-ink underline decoration-accent-ink/30 underline-offset-4 hover:decoration-accent-ink"
    >
      {/* The word replaces the old share/link icon: native share sheet or copy. */}
      <span aria-live="polite">{copied ? 'Link copied' : share ? 'Share' : 'Copy link'}</span>
    </button>
  )
}
