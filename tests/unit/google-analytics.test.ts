import { runInNewContext } from 'node:vm'

import { describe, expect, it } from 'vitest'

import { googleAnalyticsInit } from '@/lib/analytics/google'

/** Runs the init script as a browser would and returns the gtag calls it queued. */
function gtagCalls(cookie: string, globalPrivacyControl = false): unknown[][] {
  const context: Record<string, unknown> = {
    document: { cookie },
    navigator: { globalPrivacyControl },
  }
  context.window = context
  runInNewContext(googleAnalyticsInit('G-TEST1234'), context)
  return (context.dataLayer as ArrayLike<unknown>[]).map((args) => Array.from(args))
}

const consent = (calls: unknown[][]) => calls.find((call) => call[0] === 'consent')?.[2]

describe('googleAnalyticsInit', () => {
  it('counts visits without cookies until the visitor chooses detailed analytics', () => {
    expect(consent(gtagCalls(''))).toEqual({
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    })
    expect(consent(gtagCalls('qh_consent=essential'))).toMatchObject({
      analytics_storage: 'denied',
    })
    expect(consent(gtagCalls('qh_consent=detailedx'))).toMatchObject({
      analytics_storage: 'denied',
    })
  })

  it('allows GA cookies with detailed analytics, but never ads', () => {
    expect(consent(gtagCalls('qh_aid=1; qh_consent=detailed'))).toEqual({
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    })
  })

  it('honours Global Privacy Control over a detailed choice', () => {
    expect(consent(gtagCalls('qh_consent=detailed', true))).toMatchObject({
      analytics_storage: 'denied',
    })
  })

  it('sets consent before configuring the measurement ID', () => {
    const calls = gtagCalls('')
    expect(calls.map((call) => call[0])).toEqual(['consent', 'js', 'config'])
    expect(calls[2]).toEqual(['config', 'G-TEST1234'])
  })
})
