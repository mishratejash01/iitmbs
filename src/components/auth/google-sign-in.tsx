'use client'

import Script from 'next/script'
import { useEffect, useRef, useState } from 'react'

import { clientEnv } from '@/env.client'
import { track } from '@/lib/analytics/client'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z"
      />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1z" />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z"
      />
    </svg>
  )
}

type GoogleIdentity = {
  initialize(config: {
    client_id: string
    nonce: string
    ux_mode: 'popup'
    context: 'signin'
    callback: (response: { credential: string }) => void
  }): void
  renderButton(
    parent: HTMLElement,
    options: {
      type: 'standard'
      theme: 'outline' | 'filled_black'
      size: 'large'
      text: 'continue_with'
      shape: 'rectangular'
      logo_alignment: 'center'
      width: number
      click_listener: () => void
    },
  ): void
}

type WindowWithGoogle = Window & { google?: { accounts: { id: GoogleIdentity } } }

/** How long Google's button may take to appear before the redirect flow takes over. */
const BUTTON_TIMEOUT_MS = 5000

const trackClick = () =>
  track('login_click', { provider: 'google', source: 'login_page' }, { immediate: true })

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function prefersDark(): boolean {
  const theme = document.documentElement.dataset.theme
  return (
    theme === 'dark' || (theme !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches)
  )
}

/**
 * Google sign-in. With a client ID this shows Google's own button, so Google
 * names this site (not the Supabase domain) when asking which account to use.
 * If Google's script or button does not load, it falls back to the redirect
 * flow.
 */
export function GoogleSignIn({ next }: { next: string }) {
  const clientId = clientEnv.googleClientId
  const [unavailable, setUnavailable] = useState(false)
  if (!clientId || unavailable) return <RedirectSignIn next={next} />
  return <GoogleButton clientId={clientId} next={next} onUnavailable={() => setUnavailable(true)} />
}

/**
 * Renders Google's button. The ID token it returns is posted with its nonce
 * to /auth/google, which starts the Supabase session. Google gets only the
 * nonce's SHA-256, so a stolen token cannot be replayed without it.
 */
function GoogleButton({
  clientId,
  next,
  onUnavailable,
}: {
  clientId: string
  next: string
  onUnavailable: () => void
}) {
  const slot = useRef<HTMLDivElement>(null)
  const form = useRef<HTMLFormElement>(null)
  const [signIn, setSignIn] = useState<{ credential: string; nonce: string } | null>(null)

  useEffect(() => {
    if (signIn) form.current?.submit()
  }, [signIn])

  const render = async () => {
    const google = (window as WindowWithGoogle).google?.accounts.id
    const parent = slot.current
    if (!google || !parent) return onUnavailable()
    try {
      const nonce = crypto.randomUUID()
      google.initialize({
        client_id: clientId,
        nonce: await sha256Hex(nonce),
        ux_mode: 'popup',
        context: 'signin',
        callback: ({ credential }) => setSignIn({ credential, nonce }),
      })
      google.renderButton(parent, {
        type: 'standard',
        theme: prefersDark() ? 'filled_black' : 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'center',
        width: Math.min(400, Math.round(parent.clientWidth)),
        click_listener: trackClick,
      })
      // When this origin is not allowed for the client, Google draws an empty
      // 0×0 frame and reports it only in the console.
      window.setTimeout(() => {
        if (!parent.querySelector('iframe')?.offsetHeight) onUnavailable()
      }, BUTTON_TIMEOUT_MS)
    } catch (error) {
      console.error('[auth] Google button failed:', error)
      onUnavailable()
    }
  }

  return (
    <div>
      <Script
        src="https://accounts.google.com/gsi/client"
        onReady={() => void render()}
        onError={onUnavailable}
      />
      <div ref={slot} className="flex min-h-11 justify-center" />
      {signIn ? (
        <p role="status" className="mt-3 text-center text-muted">
          Signing you in…
        </p>
      ) : null}
      <form ref={form} method="post" action="/auth/google" hidden>
        <input type="hidden" name="credential" value={signIn?.credential ?? ''} />
        <input type="hidden" name="nonce" value={signIn?.nonce ?? ''} />
        <input type="hidden" name="next" value={next} />
      </form>
    </div>
  )
}

/** Redirect (PKCE) flow; Supabase returns to /auth/callback. */
function RedirectSignIn({ next }: { next: string }) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const signIn = async () => {
    setPending(true)
    setError(null)
    trackClick()
    const { error: oauthError } = await getSupabaseBrowserClient().auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        queryParams: { prompt: 'select_account' },
      },
    })
    if (oauthError) {
      track(
        'login_failure',
        { provider: 'google', reason: oauthError.message.slice(0, 200) },
        { immediate: true },
      )
      setError('Could not start Google sign-in. Please try again.')
      setPending(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={signIn}
        disabled={pending}
        className="flex min-h-12 w-full items-center justify-center gap-3 rounded-control border border-border-strong bg-card px-4 font-medium text-text transition-colors hover:border-accent disabled:opacity-60"
      >
        <GoogleMark />
        {pending ? 'Opening Google…' : 'Continue with Google'}
      </button>
      {error ? (
        <p role="alert" className="mt-3 text-small text-danger">
          {error}
        </p>
      ) : null}
    </div>
  )
}
