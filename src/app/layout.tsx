import type { Metadata, Viewport } from 'next'
import { Poppins } from 'next/font/google'

import './globals.css'

import { Analytics } from '@/components/analytics/analytics'
import { GoogleAnalytics } from '@/components/analytics/google-analytics'
import { Analytics as VercelAnalytics } from '@vercel/analytics/next'
import { ConsentBanner } from '@/components/consent/consent-banner'
import { ClientEnhancements } from '@/components/enhancements/client-enhancements'
import { SkipLink } from '@/components/layout/skip-link'
import { ServiceWorkerRegister } from '@/components/pwa/service-worker'
import { env, features } from '@/env'
import { getSiteSettings } from '@/lib/data/settings'
import { buildThemeCss, resolveTokens } from '@/lib/theme/tokens'

const poppins = Poppins({
  subsets: ['latin'],
  // Only the weights the design uses (400 body, 500 medium, 600 headings, 700 display).
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-poppins',
})

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  const verification = settings.verification
  const other: Record<string, string> = {}
  if (verification.bing) other['msvalidate.01'] = verification.bing
  if (verification.yandex) other['yandex-verification'] = verification.yandex

  return {
    metadataBase: new URL(env.siteUrl),
    applicationName: settings.site_name,
    title: {
      default: settings.seo.default_title || settings.site_name,
      // Admin-editable, e.g. "%s | {site_name}"; must keep the %s placeholder.
      template: settings.seo.title_template.includes('%s')
        ? settings.seo.title_template.replaceAll('{site_name}', settings.site_name)
        : `%s | ${settings.site_name}`,
    },
    description: settings.seo.default_description || settings.description,
    verification: {
      ...(verification.google ? { google: verification.google } : {}),
      ...(Object.keys(other).length > 0 ? { other } : {}),
    },
    formatDetection: { telephone: false, email: false, address: false },
    appleWebApp: { capable: true, title: settings.site_name, statusBarStyle: 'default' },
    icons: { apple: [{ url: '/pwa-icon/apple-180', sizes: '180x180', type: 'image/png' }] },
    openGraph: { siteName: settings.site_name, locale: 'en_IN', type: 'website' },
    twitter: { card: 'summary_large_image' },
  }
}

export async function generateViewport(): Promise<Viewport> {
  const settings = await getSiteSettings()
  const tokens = resolveTokens(settings.theme)
  return {
    width: 'device-width',
    initialScale: 1,
    colorScheme: 'light',
    themeColor: tokens.light.bg,
  }
}

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const settings = await getSiteSettings()

  return (
    <html lang="en" className={poppins.variable} suppressHydrationWarning>
      <head>
        <style
          id="theme-tokens"
          // Token values are validated hex colours (sanitizeThemeOverrides).
          dangerouslySetInnerHTML={{
            __html: buildThemeCss(settings.theme),
          }}
        />
      </head>
      <body className="flex min-h-dvh flex-col">
        <SkipLink />
        {children}
        <Analytics heartbeatSeconds={settings.analytics.heartbeat_seconds} />
        {features.vercelAnalytics ? <VercelAnalytics /> : null}
        <GoogleAnalytics />
        <ConsentBanner />
        <ClientEnhancements />
        {settings.features.pwa ? <ServiceWorkerRegister /> : null}
      </body>
    </html>
  )
}
