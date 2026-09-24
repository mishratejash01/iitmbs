import type { Metadata } from 'next'

import { ConsentForm, DeleteAccountForm, ProfileForm } from '@/components/dashboard/settings-forms'
import { buttonClasses } from '@/components/ui/button'
import { getCurrentProfile } from '@/lib/auth/session'
import { getPrograms } from '@/lib/data/programs'
import { getSiteSettings } from '@/lib/data/settings'
import { privateMetadata } from '@/lib/seo/metadata'
import { nearbyTerms } from '@/lib/terms'

// Reads the session, so it renders on each request.
export const instant = false

export async function generateMetadata(): Promise<Metadata> {
  return privateMetadata('Settings', await getSiteSettings())
}

export default async function SettingsPage() {
  const [profile, programs, settings] = await Promise.all([
    getCurrentProfile(),
    getPrograms(),
    getSiteSettings(),
  ])

  return (
    <div className="container-reading space-y-10">
      <h1 className="text-h2 font-semibold text-text">Settings</h1>

      <section aria-labelledby="profile-heading" className="border-t border-border pt-8">
        <h2 id="profile-heading" className="mb-4 text-h3 font-semibold text-text">
          Profile
        </h2>
        <ProfileForm
          profile={{
            full_name: profile?.full_name ?? null,
            program_id: profile?.program_id ?? null,
            current_term: profile?.current_term ?? null,
            marketing_consent: profile?.marketing_consent ?? false,
          }}
          programs={programs.map((p) => ({ id: p.id, shortName: p.shortName }))}
          terms={nearbyTerms(settings.current_term)}
        />
      </section>

      <section aria-labelledby="analytics-heading" className="border-t border-border pt-8">
        <h2 id="analytics-heading" className="mb-4 text-h3 font-semibold text-text">
          Analytics
        </h2>
        <ConsentForm detailed={profile?.analytics_consent ?? false} />
      </section>

      <section aria-labelledby="data-heading" className="border-t border-border pt-8">
        <h2 id="data-heading" className="text-h3 font-semibold text-text">
          Your data
        </h2>
        <p className="mt-2 text-small text-muted">
          Download a copy of everything linked to your account: profile, bookmarks, history,
          progress, feedback and analytics.
        </p>
        {/* A plain link: the API responds with a file download, not a page. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/api/me/export" className={buttonClasses('secondary', 'md', 'mt-4')}>
          Download my data
        </a>
      </section>

      <section aria-labelledby="danger-heading" className="rounded-card bg-danger-soft p-5 sm:p-6">
        <h2 id="danger-heading" className="text-h3 font-semibold text-danger">
          Delete account
        </h2>
        <div className="mt-3">
          <DeleteAccountForm />
        </div>
      </section>
    </div>
  )
}
