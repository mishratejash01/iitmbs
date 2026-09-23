import Image from 'next/image'

import type { MediaInfo } from '@/lib/data/media'

const toNumber = (value: string | number | undefined) => {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : undefined
}

/**
 * A Cloudinary image with its stored dimensions (no layout shift), responsive
 * sizes and lazy loading. Alt text falls back to the media library's.
 */
export function Figure({
  src,
  alt,
  caption,
  width,
  height,
  media,
}: {
  src?: string
  alt?: string
  caption?: string
  width?: string | number
  height?: string | number
  media?: MediaInfo
}) {
  if (!src) return null
  const publicId = src.replace(/^cloudinary:/i, '')
  const w = toNumber(width) ?? media?.width ?? 1200
  const h = toNumber(height) ?? media?.height ?? Math.round((w * 9) / 16)
  const altText = alt || media?.alt || ''
  const captionText = caption || media?.caption

  return (
    <figure className="my-6">
      <Image
        src={publicId}
        alt={altText}
        width={w}
        height={h}
        sizes="(min-width: 768px) 720px, 100vw"
        className="h-auto w-full rounded-control border border-border bg-surface"
      />
      {captionText || media?.credit ? (
        <figcaption className="mt-2 text-center text-small text-muted">
          {captionText}
          {media?.credit ? <span className="block text-xs">Credit: {media.credit}</span> : null}
        </figcaption>
      ) : null}
    </figure>
  )
}
