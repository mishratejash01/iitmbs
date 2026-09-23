/**
 * Browser-safe configuration. Only `NEXT_PUBLIC_*` variables live here, each
 * referenced literally so Next.js can inline it into client bundles.
 *
 * This module is deliberately dependency-free (no Zod) because it ships to the
 * browser. The same variables are validated with Zod in `src/env.ts`, which is
 * evaluated on the server at build time and at startup, so a misconfigured
 * deployment fails there before any of these values reach a client.
 */

const blank = (value: string | undefined) =>
  value === undefined || value.trim() === '' ? undefined : value.trim()

/** Normalises a URL-ish value to its origin (no path, no trailing slash). */
export function toOrigin(value: string | undefined): string | undefined {
  const raw = blank(value)
  if (!raw) return undefined
  try {
    return new URL(raw.includes('://') ? raw : `https://${raw}`).origin
  } catch {
    return undefined
  }
}

export const publicEnvInput = {
  // Falls back to the Vercel production hostname when the site URL is unset.
  NEXT_PUBLIC_SITE_URL:
    blank(process.env.NEXT_PUBLIC_SITE_URL) ??
    blank(process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL),
  NEXT_PUBLIC_SUPABASE_URL: blank(process.env.NEXT_PUBLIC_SUPABASE_URL),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: blank(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: blank(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME),
} as const

export const clientEnv = {
  siteUrl: toOrigin(publicEnvInput.NEXT_PUBLIC_SITE_URL) ?? 'http://localhost:3000',
  supabaseUrl: toOrigin(publicEnvInput.NEXT_PUBLIC_SUPABASE_URL) ?? '',
  supabaseAnonKey: publicEnvInput.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  cloudinaryCloudName: publicEnvInput.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? null,
} as const

export type ClientEnv = typeof clientEnv
