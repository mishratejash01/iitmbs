import 'server-only'

import { createHash } from 'node:crypto'

import { env, features } from '@/env'

type Params = Record<string, string | number | boolean | undefined>

/** Cloudinary API signature: SHA-1 of the sorted params plus the secret. */
export function signParams(params: Params): string {
  const secret = env.cloudinary.apiSecret
  if (!secret) throw new Error('Cloudinary is not configured')
  const toSign = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&')
  return createHash('sha1').update(`${toSign}${secret}`).digest('hex')
}

export type UploadSignature = {
  cloudName: string
  apiKey: string
  timestamp: number
  signature: string
  folder: string
  type: 'upload' | 'authenticated'
}

/**
 * Parameters for a direct, signed browser upload. Files meant for tracked
 * downloads use the "authenticated" delivery type, so they can only be
 * fetched through short-lived signed URLs from /api/download.
 */
export function createUploadSignature(
  options: { folder?: string; type?: 'upload' | 'authenticated' } = {},
): UploadSignature {
  if (!features.cloudinary) throw new Error('Cloudinary is not configured')
  const timestamp = Math.floor(Date.now() / 1000)
  const folder = [env.cloudinary.uploadFolder, options.folder].filter(Boolean).join('/')
  const type = options.type ?? 'upload'
  const signature = signParams({ folder, timestamp, type })
  return {
    cloudName: env.cloudinary.cloudName!,
    apiKey: env.cloudinary.apiKey!,
    timestamp,
    signature,
    folder,
    type,
  }
}

/** A short-lived URL that downloads a Cloudinary asset (any delivery type). */
export function privateDownloadUrl(input: {
  publicId: string
  resourceType: 'image' | 'raw' | 'video'
  deliveryType: 'upload' | 'authenticated'
  format?: string | null
  ttlSeconds?: number
}): string {
  if (!features.cloudinary) throw new Error('Cloudinary is not configured')
  const timestamp = Math.floor(Date.now() / 1000)
  const params: Params = {
    public_id: input.publicId,
    format: input.resourceType === 'raw' ? undefined : (input.format ?? undefined),
    type: input.deliveryType,
    expires_at: timestamp + (input.ttlSeconds ?? 300),
    timestamp,
    attachment: true,
  }
  const signature = signParams(params)
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params))
    if (value !== undefined) query.set(key, String(value))
  query.set('api_key', env.cloudinary.apiKey!)
  query.set('signature', signature)
  return `https://api.cloudinary.com/v1_1/${env.cloudinary.cloudName}/${input.resourceType}/download?${query}`
}
