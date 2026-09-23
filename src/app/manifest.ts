import type { MetadataRoute } from 'next'

import { getSiteSettings } from '@/lib/data/settings'
import { resolveTokens } from '@/lib/theme/tokens'

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getSiteSettings()
  const tokens = resolveTokens(settings.theme)
  return {
    name: settings.site_name,
    short_name:
      settings.site_name.length > 12 ? settings.site_name.split(' ')[0] : settings.site_name,
    description: settings.description || settings.tagline,
    start_url: '/?source=pwa',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: tokens.light.bg,
    theme_color: tokens.light.bg,
    lang: 'en-IN',
    categories: ['education'],
    icons: [
      { src: '/pwa-icon/192', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/pwa-icon/512', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/pwa-icon/maskable-512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
