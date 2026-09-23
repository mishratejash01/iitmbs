import type { MetadataRoute } from 'next'

import { env } from '@/env'

/**
 * Production allows crawling of public content only. Preview and development
 * deployments are fully disallowed so preview URLs never get indexed.
 */
export default function robots(): MetadataRoute.Robots {
  if (env.deploymentEnv !== 'production') {
    return { rules: [{ userAgent: '*', disallow: '/' }] }
  }
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/dashboard', '/api/', '/auth/', '/login', '/onboarding', '/search'],
      },
    ],
    sitemap: `${env.siteUrl}/sitemap.xml`,
    host: env.siteUrl,
  }
}
