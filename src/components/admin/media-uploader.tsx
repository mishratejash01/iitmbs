'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { ImageUploadFlow } from './image-picker'
import { Panel } from './ui'

/** Upload box on the media library page. */
export function MediaUploader() {
  const router = useRouter()
  const [last, setLast] = useState<string | null>(null)
  return (
    <Panel className="mb-4">
      <ImageUploadFlow
        onDone={(asset) => {
          setLast(asset.public_id)
          router.refresh()
        }}
      />
      <p className="mt-2 text-xs text-muted">
        {last ? (
          <>
            Added <code className="rounded bg-surface px-1">{last}</code>. Use it in MDX as{' '}
            <code className="rounded bg-surface px-1">![alt](cloudinary:{last})</code>.
          </>
        ) : (
          'Images are optimised and resized automatically when shown on the site.'
        )}
      </p>
    </Panel>
  )
}
