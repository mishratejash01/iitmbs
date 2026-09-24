'use client'

import { usePathname } from 'next/navigation'
import Script from 'next/script'
import { useEffect } from 'react'

import { clientEnv } from '@/env.client'
import { googleAnalyticsInit, syncGoogleConsent } from '@/lib/analytics/google'

/**
 * Google Analytics 4 in consent mode, alongside the site's own analytics.
 * Page views on client-side navigation are sent by GA's enhanced measurement
 * (browser history changes). The admin is not tracked.
 */
export function GoogleAnalytics() {
  const id = clientEnv.gaMeasurementId
  const pathname = usePathname()
  const admin = pathname.startsWith('/admin')

  useEffect(() => {
    if (!id) return
    // GA's own switch: while true, no hits are sent.
    ;(window as unknown as Record<string, unknown>)[`ga-disable-${id}`] = admin
    // Picks up a choice changed on the server (settings, onboarding).
    syncGoogleConsent()
  }, [id, admin, pathname])

  if (!id || admin) return null
  return (
    <>
      <Script id="ga-init">{googleAnalyticsInit(id)}</Script>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} />
    </>
  )
}
