import { getConsent } from './client'
import { ANALYTICS_COOKIES } from './events'

type Gtag = (...args: unknown[]) => void

// Ad features are never used, whatever the visitor chooses.
const ADS_DENIED = { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' }

/**
 * Starts Google Analytics in consent mode. It runs before gtag.js loads, so
 * it reads the choice from the cookie itself: GA cookies only with
 * "detailed" (and no Global Privacy Control signal); otherwise GA counts the
 * visit without cookies.
 */
export function googleAnalyticsInit(measurementId: string): string {
  return [
    'window.dataLayer=window.dataLayer||[];',
    'function gtag(){dataLayer.push(arguments)}',
    'window.gtag=gtag;',
    `var detailed=/(?:^|;\\s*)${ANALYTICS_COOKIES.consent}=detailed(?:;|$)/.test(document.cookie)&&!navigator.globalPrivacyControl;`,
    `gtag('consent','default',Object.assign({analytics_storage:detailed?'granted':'denied'},${JSON.stringify(ADS_DENIED)}));`,
    "gtag('js',new Date());",
    `gtag('config',${JSON.stringify(measurementId)});`,
  ].join('')
}

/** Applies the visitor's current analytics choice to Google Analytics, if it is loaded. */
export function syncGoogleConsent() {
  const gtag = (window as Window & { gtag?: Gtag }).gtag
  gtag?.('consent', 'update', {
    analytics_storage: getConsent() === 'detailed' ? 'granted' : 'denied',
    ...ADS_DENIED,
  })
}
