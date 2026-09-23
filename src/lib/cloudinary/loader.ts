import { clientEnv } from '@/env.client'

type LoaderParams = { src: string; width: number; quality?: number }

const CLOUDINARY_UPLOAD_URL = /^https:\/\/res\.cloudinary\.com\/([^/]+)\/image\/upload\/(.+)$/

function encodePublicId(publicId: string): string {
  return publicId
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')
}

function transformation(width: number, quality?: number): string {
  // f_auto picks AVIF/WebP per browser; c_limit never upscales past the original.
  return ['f_auto', quality ? `q_${quality}` : 'q_auto', 'c_limit', `w_${width}`].join(',')
}

/**
 * Global `next/image` loader (configured in next.config.ts).
 *
 * - A bare Cloudinary public id (e.g. `qualifier-hub/maths-1/venn`) becomes a
 *   responsive delivery URL with `f_auto,q_auto`.
 * - A full Cloudinary upload URL gets the same transformation injected.
 * - Local (`/…`) and other absolute URLs pass through with a width hint.
 */
export default function cloudinaryLoader({ src, width, quality }: LoaderParams): string {
  if (src.startsWith('/') || src.startsWith('data:') || src.startsWith('blob:')) {
    return `${src}${src.includes('?') ? '&' : '?'}w=${width}`
  }

  const uploadMatch = CLOUDINARY_UPLOAD_URL.exec(src)
  if (uploadMatch) {
    const [, cloud, rest] = uploadMatch
    // Drop existing leading transformation segments (e.g. "f_auto,q_auto,w_600/")
    // and apply ours instead. Only well-known transformation keys are matched so
    // a folder name such as "qh_notes" is never mistaken for one.
    const path = (rest ?? '').replace(
      /^(?:(?:ar|b|bo|c|dpr|e|f|fl|g|h|q|r|t|w|x|y|z)_[^/,]+(?:,[a-z]{1,3}_[^/,]+)*\/)+/,
      '',
    )
    return `https://res.cloudinary.com/${cloud}/image/upload/${transformation(width, quality)}/${path}`
  }

  if (/^https?:\/\//.test(src)) {
    return src
  }

  const cloud = clientEnv.cloudinaryCloudName
  if (!cloud) {
    return src
  }
  return `https://res.cloudinary.com/${cloud}/image/upload/${transformation(width, quality)}/${encodePublicId(src)}`
}
