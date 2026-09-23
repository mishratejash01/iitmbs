import 'server-only'

import { env, features } from '@/env'
import { absoluteUrl } from '@/lib/routes'

/**
 * Notifies IndexNow (Bing, Yandex, Seznam, Naver, …) that URLs changed.
 * Google does not use IndexNow and retired its sitemap "ping" endpoint in
 * 2023; it discovers changes through the sitemap's lastmod instead.
 */
export async function pingIndexNow(paths: string[]): Promise<{ sent: number; skipped?: string }> {
  if (!features.indexNow || !env.indexNowKey) return { sent: 0, skipped: 'INDEXNOW_KEY not set' }
  if (env.deploymentEnv !== 'production') return { sent: 0, skipped: 'not production' }
  const urlList = [...new Set(paths)].slice(0, 10_000).map((path) => absoluteUrl(env.siteUrl, path))
  if (urlList.length === 0) return { sent: 0 }

  const host = new URL(env.siteUrl).host
  const response = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host,
      key: env.indexNowKey,
      keyLocation: absoluteUrl(env.siteUrl, '/indexnow-key.txt'),
      urlList,
    }),
  })
  if (!response.ok && response.status !== 202) {
    console.error(`[indexnow] ping failed: ${response.status}`)
    return { sent: 0, skipped: `HTTP ${response.status}` }
  }
  return { sent: urlList.length }
}
