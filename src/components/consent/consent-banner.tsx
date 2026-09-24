'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useId, useState, useSyncExternalStore } from 'react'

import { Button } from '@/components/ui/button'
import { getConsent, readCookie, track, writeCookie } from '@/lib/analytics/client'
import { ANALYTICS_COOKIES } from '@/lib/analytics/events'
import { syncGoogleConsent } from '@/lib/analytics/google'

import { OPEN_CONSENT_EVENT } from './consent-settings-button'

/**
 * First-visit analytics choice (DPDP Act 2023). Essential analytics are
 * pseudonymous and always on; detailed analytics link activity to an account
 * and need an explicit opt-in from someone who confirms they are 18+.
 */
const BANNER_ID = 'consent-banner'

// Static pages are the same for everyone, so the banner ships hidden. This runs
// while the HTML is parsed and shows it at once to visitors who have not chosen
// yet, instead of after hydration (which made it the page's late, largest paint).
const REVEAL_SCRIPT = `(function(){try{if(!/(?:^|;\\s*)qh_consent=/.test(document.cookie)){var b=document.getElementById('${BANNER_ID}');if(b)b.hidden=false}}catch(e){}})()`

// Browser-only values read without an effect; the server render assumes a
// choice was already made so the banner never flashes during hydration.
const subscribeNever = () => () => {}
const readGpc = () =>
  Boolean((navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl)
const readHasChoice = () => Boolean(readCookie(ANALYTICS_COOKIES.consent))

export function ConsentBanner() {
  const [override, setOverride] = useState<'open' | 'closed' | null>(null)
  const [choosingDetailed, setChoosingDetailed] = useState(false)
  const [adult, setAdult] = useState(false)
  const gpc = useSyncExternalStore(subscribeNever, readGpc, () => false)
  const hasChoice = useSyncExternalStore(subscribeNever, readHasChoice, () => true)
  const open = override ? override === 'open' : !hasChoice
  const checkboxId = useId()
  const pathname = usePathname()

  useEffect(() => {
    const reopen = () => {
      setChoosingDetailed(false)
      setAdult(false)
      setOverride('open')
    }
    window.addEventListener(OPEN_CONSENT_EVENT, reopen)
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, reopen)
  }, [])

  const save = (level: 'essential' | 'detailed') => {
    const firstChoice = !readHasChoice()
    const previous = getConsent()
    writeCookie(ANALYTICS_COOKIES.consent, level, 60 * 60 * 24 * 365)
    syncGoogleConsent()
    if (firstChoice || previous !== level) track('consent_update', { level })
    // Persist on the profile when signed in (ignored otherwise).
    void fetch('/api/me/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, adult: level === 'detailed' ? adult : false }),
    }).catch(() => undefined)
    setOverride('closed')
  }

  // The admin is not tracked, so there is nothing to choose there.
  if (pathname.startsWith('/admin')) return null

  return (
    <>
      <section
        id={BANNER_ID}
        hidden={!open}
        // The inline script below may reveal it before hydration.
        suppressHydrationWarning
        aria-label="Analytics choices"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card p-4 shadow-card sm:inset-x-auto sm:right-4 sm:bottom-4 sm:max-w-md sm:rounded-card sm:border"
        data-print="hide"
      >
        <p className="text-small font-semibold text-text">Your analytics choice</p>
        <p className="mt-1 text-small text-muted">
          We use pseudonymous analytics to see which pages help — never your name, email or IP
          address.{' '}
          {gpc
            ? 'Your browser sends Global Privacy Control, so that is all we use.'
            : 'Detailed analytics, linked to your account and with Google Analytics cookies, are optional.'}{' '}
          <Link href="/privacy" className="font-medium text-accent-ink underline">
            Privacy policy
          </Link>
        </p>

        {choosingDetailed && !gpc ? (
          <div className="mt-3 flex items-start gap-2">
            <input
              id={checkboxId}
              type="checkbox"
              checked={adult}
              onChange={(event) => setAdult(event.target.checked)}
              className="mt-1 size-4 accent-[var(--accent-strong)]"
            />
            <label htmlFor={checkboxId} className="text-small text-text">
              I am 18 or older and allow detailed analytics linked to my account, including Google
              Analytics cookies.
            </label>
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => save('essential')}>
            {gpc ? 'OK' : 'Essential only'}
          </Button>
          {!gpc ? (
            choosingDetailed ? (
              <Button size="sm" disabled={!adult} onClick={() => save('detailed')}>
                Allow detailed
              </Button>
            ) : (
              <Button variant="soft" size="sm" onClick={() => setChoosingDetailed(true)}>
                Allow detailed…
              </Button>
            )
          ) : null}
        </div>
      </section>
      <script dangerouslySetInnerHTML={{ __html: REVEAL_SCRIPT }} />
    </>
  )
}
