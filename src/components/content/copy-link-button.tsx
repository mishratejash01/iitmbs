'use client'

import { Link2, Share2 } from 'lucide-react'
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
        // Share sheet dismissed — fall back to copying.
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
  const Icon = share ? Share2 : Link2
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-11 items-center gap-2 rounded-control border border-border px-3 text-small font-medium text-text hover:border-accent"
    >
      <Icon aria-hidden="true" className="size-4" />
      <span aria-live="polite">{copied ? 'Link copied' : 'Share'}</span>
    </button>
  )
}
