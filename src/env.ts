import 'server-only'

import { z } from 'zod'

import { publicEnvInput, toOrigin } from './env.client'

/**
 * Every environment variable the app reads, validated with Zod once at build
 * time and at server startup. Browser code reads the public subset through the
 * dependency-free `src/env.client.ts`; this module re-validates those same
 * values so a bad deployment fails here, loudly, before serving anything.
 *
 * Optional integrations (Cloudinary, IndexNow, privileged Supabase access) may
 * be absent: the matching entry in `features` is then false and the UI
 * degrades gracefully instead of crashing.
 */

const blankToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value

const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess(blankToUndefined, schema.optional())

const origin = z.string().transform((value, ctx) => {
  const normalised = toOrigin(value)
  if (!normalised || !/^https?:\/\//.test(normalised)) {
    ctx.addIssue({ code: 'custom', message: 'must be an absolute http(s) URL' })
    return z.NEVER
  }
  return normalised
})

const schema = z.object({
  // Public (also inlined into the browser bundle by src/env.client.ts)
  NEXT_PUBLIC_SITE_URL: origin,
  NEXT_PUBLIC_SUPABASE_URL: origin,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20, 'looks truncated'),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: optional(z.string().regex(/^[a-z0-9_-]+$/i)),
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: optional(
    z.string().regex(/^[\w-]+\.apps\.googleusercontent\.com$/, 'must be a Google OAuth client ID'),
  ),
  NEXT_PUBLIC_GA_MEASUREMENT_ID: optional(
    z.string().regex(/^G-[A-Z0-9]{4,20}$/, 'must be a GA4 measurement ID (G-…)'),
  ),

  // Server-only
  SUPABASE_SERVICE_ROLE_KEY: optional(z.string().min(20, 'looks truncated')),
  CLOUDINARY_API_KEY: optional(z.string().regex(/^\d+$/, 'must be numeric')),
  CLOUDINARY_API_SECRET: optional(z.string().min(10, 'looks truncated')),
  CLOUDINARY_UPLOAD_FOLDER: optional(
    z.string().regex(/^[a-z0-9/_-]+$/i, 'letters, digits, "/", "_" and "-" only'),
  ),
  REVALIDATE_SECRET: optional(z.string().min(32, 'use at least 32 characters')),
  INDEXNOW_KEY: optional(z.string().regex(/^[a-zA-Z0-9-]{8,128}$/, '8–128 chars of [a-zA-Z0-9-]')),
  ANALYTICS_HASH_SECRET: optional(z.string().min(16, 'use at least 16 characters')),
})

const parsed = schema.safeParse({ ...process.env, ...publicEnvInput })

if (!parsed.success) {
  throw new Error(
    `Invalid environment variables — see .env.example.\n${z.prettifyError(parsed.error)}`,
  )
}

const v = parsed.data

export const env = {
  siteUrl: v.NEXT_PUBLIC_SITE_URL,
  supabaseUrl: v.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: v.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: v.SUPABASE_SERVICE_ROLE_KEY ?? null,
  cloudinary: {
    cloudName: v.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? null,
    apiKey: v.CLOUDINARY_API_KEY ?? null,
    apiSecret: v.CLOUDINARY_API_SECRET ?? null,
    uploadFolder: v.CLOUDINARY_UPLOAD_FOLDER ?? 'qualifier-hub',
  },
  revalidateSecret: v.REVALIDATE_SECRET ?? null,
  indexNowKey: v.INDEXNOW_KEY ?? null,
  analyticsHashSecret: v.ANALYTICS_HASH_SECRET ?? null,
  isProduction: process.env.NODE_ENV === 'production',
  // VERCEL_ENV distinguishes production from preview deployments; elsewhere a
  // production build is treated as production.
  deploymentEnv: (process.env.VERCEL_ENV ??
    (process.env.NODE_ENV === 'production' ? 'production' : 'development')) as
    'production' | 'preview' | 'development',
} as const

/** Which optional integrations are configured in this environment. */
export const features = {
  serviceRole: env.supabaseServiceRoleKey !== null,
  cloudinary:
    env.cloudinary.cloudName !== null &&
    env.cloudinary.apiKey !== null &&
    env.cloudinary.apiSecret !== null,
  indexNow: env.indexNowKey !== null,
  revalidateWebhook: env.revalidateSecret !== null,
} as const
