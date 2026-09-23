import { Clock } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { GoogleSignIn } from '@/components/auth/google-sign-in'
import { getSessionUser } from '@/lib/auth/session'
import { safeNextPath } from '@/lib/auth/safe-next'
import { getLoginAvailability } from '@/lib/data/auth-availability'
import { getSiteSettings } from '@/lib/data/settings'
import { privateMetadata } from '@/lib/seo/metadata'

export async function generateMetadata(): Promise<Metadata> {
  return privateMetadata('Log in', await getSiteSettings())
}

const ERRORS: Record<string, string> = {
  callback: 'Sign-in could not be completed. Please try again.',
  denied: 'Google sign-in was cancelled.',
}

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  const params = await searchParams
  const next = safeNextPath(typeof params.next === 'string' ? params.next : null)
  if (await getSessionUser()) redirect(next)

  const [availability, settings] = await Promise.all([getLoginAvailability(), getSiteSettings()])
  const error = typeof params.error === 'string' ? (ERRORS[params.error] ?? ERRORS.callback) : null

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-h2 font-semibold text-text">Log in to {settings.site_name}</h1>
      <p className="mt-2 text-muted">
        Everything is free to read without an account. Signing in adds bookmarks, reading history and progress ticks.
      </p>

      <div className="mt-8">
        {availability.enabled ? (
          <GoogleSignIn next={next} />
        ) : (
          <div className="rounded-card border border-border bg-surface p-4" role="status">
            <p className="flex items-center gap-2 font-medium text-text">
              <Clock aria-hidden="true" className="size-4 text-accent-ink" />
              Login coming soon
            </p>
            <p className="mt-1 text-small text-muted">
              Sign-in with Google is being set up. You can keep using every page in the meantime.
            </p>
          </div>
        )}
        {error ? (
          <p role="alert" className="mt-4 text-small text-danger">
            {error}
          </p>
        ) : null}
      </div>

      <p className="mt-8 text-xs text-muted">
        By continuing you agree to the{' '}
        <Link href="/terms" className="underline">
          terms
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="underline">
          privacy policy
        </Link>
        . Under 18? Please sign in only with a parent or guardian’s consent.
      </p>
    </div>
  )
}
