import 'server-only'

import { cacheLife } from 'next/cache'

import { env } from '@/env'

import { getSiteSettings } from './settings'

/**
 * Whether Google sign-in can actually be used: the feature flag is on AND the
 * Google provider is enabled in Supabase Auth. Checked against Supabase's
 * public settings endpoint, so adding Google credentials in the Supabase
 * dashboard turns sign-in on with no code change or redeploy.
 */
export async function getLoginAvailability(): Promise<{ enabled: boolean; google: boolean }> {
  'use cache'
  cacheLife({ stale: 300, revalidate: 600, expire: 86400 })

  const settings = await getSiteSettings()
  let google = false
  try {
    const response = await fetch(`${env.supabaseUrl}/auth/v1/settings`, {
      headers: { apikey: env.supabaseAnonKey },
    })
    if (response.ok) {
      const body = (await response.json()) as { external?: { google?: boolean } }
      google = Boolean(body.external?.google)
    }
  } catch (error) {
    console.error('[auth] could not read auth settings:', error)
  }
  return { enabled: settings.features.login && google, google }
}
