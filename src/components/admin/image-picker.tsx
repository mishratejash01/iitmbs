'use client'

import { useId, useRef, useState } from 'react'

import { registerMedia } from '@/app/admin/actions'
import { Button } from '@/components/ui/button'
import { uploadToCloudinary, type UploadedAsset } from '@/lib/admin/upload'
import { cloudinaryImageUrl } from '@/lib/cloudinary/url'

import { inputClasses } from './ui'

/**
 * Upload an image, describe it, and add it to the media library. Alt text is
 * required before the image is saved — it is what screen readers announce
 * and what image search indexes.
 */
export function ImageUploadFlow({
  onDone,
  folder = 'images',
  compact = false,
}: {
  onDone: (asset: UploadedAsset & { alt_text: string }) => void
  folder?: string
  compact?: boolean
}) {
  const id = useId()
  const fileRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<UploadedAsset | null>(null)
  const [alt, setAlt] = useState('')
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function onFile(file: File | undefined) {
    if (!file) return
    setError(null)
    if (!file.type.startsWith('image/')) {
      setError('Choose an image file (PNG, JPG, WebP or GIF).')
      return
    }
    try {
      setProgress(0)
      const asset = await uploadToCloudinary(file, {
        type: 'upload',
        folder,
        onProgress: setProgress,
      })
      setPending(asset)
      setAlt(file.name.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' '))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed.')
    } finally {
      setProgress(null)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function save() {
    if (!pending) return
    const text = alt.trim()
    if (text.length < 3) {
      setError('Describe the image in a few words.')
      return
    }
    const result = await registerMedia({ ...pending, alt_text: text })
    if (!result.ok) {
      setError(result.message ?? 'Could not save the image.')
      return
    }
    onDone({ ...pending, alt_text: text })
    setPending(null)
    setAlt('')
  }

  if (pending) {
    return (
      <div className="flex flex-wrap items-start gap-3 rounded-control border border-border bg-surface p-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- admin preview straight from Cloudinary */}
        <img
          src={cloudinaryImageUrl(pending.public_id, { width: 240, height: 160, crop: 'fit' })}
          alt=""
          className="h-20 w-auto rounded border border-border bg-card"
        />
        <div className="min-w-56 flex-1">
          <label htmlFor={`${id}-alt`} className="text-xs font-medium text-text">
            Alt text <span className="text-muted">(what does the image show?)</span>
          </label>
          <input
            id={`${id}-alt`}
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            maxLength={300}
            className={inputClasses}
            autoFocus
          />
          <div className="mt-2 flex gap-2">
            <Button size="sm" onClick={save}>
              Use image
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setPending(null)}>
              Cancel
            </Button>
          </div>
          {error ? <p className="mt-1 text-xs text-danger">{error}</p> : null}
        </div>
      </div>
    )
  }

  return (
    <div
      className={compact ? 'inline-flex items-center gap-2' : 'flex flex-wrap items-center gap-2'}
    >
      <input
        ref={fileRef}
        id={`${id}-file`}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
        className="sr-only"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      <label
        htmlFor={`${id}-file`}
        className="inline-flex min-h-10 cursor-pointer items-center rounded-control border border-border-strong bg-card px-3 text-small font-medium text-text hover:border-accent"
      >
        {progress !== null ? `Uploading… ${Math.round(progress * 100)}%` : 'Upload image'}
      </label>
      {error ? <span className="text-xs text-danger">{error}</span> : null}
    </div>
  )
}
