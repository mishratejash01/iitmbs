import { clientEnv } from '@/env.client'

/**
 * Absolute Cloudinary delivery URL with automatic format/quality. Used where
 * next/image cannot be (Open Graph images, emails, JSON-LD).
 */
export function cloudinaryImageUrl(
  publicId: string,
  options: { width?: number; height?: number; crop?: 'fill' | 'limit' | 'fit' } = {},
): string {
  const cloud = clientEnv.cloudinaryCloudName
  const id = publicId.replace(/^cloudinary:/i, '')
  if (!cloud || /^https?:\/\//.test(id)) return id
  const transformation = [
    'f_auto',
    'q_auto',
    options.crop ? `c_${options.crop}` : null,
    options.width ? `w_${options.width}` : null,
    options.height ? `h_${options.height}` : null,
  ]
    .filter(Boolean)
    .join(',')
  const path = id.split('/').map(encodeURIComponent).join('/')
  return `https://res.cloudinary.com/${cloud}/image/upload/${transformation}/${path}`
}
