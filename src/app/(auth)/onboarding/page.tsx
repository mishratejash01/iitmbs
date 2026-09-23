import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { OnboardingForm } from '@/components/auth/onboarding-form'
import { safeNextPath } from '@/lib/auth/safe-next'
import { getCurrentProfile, requireUser } from '@/lib/auth/session'
import { getPrograms } from '@/lib/data/programs'
import { getSiteSettings } from '@/lib/data/settings'
import { privateMetadata } from '@/lib/seo/metadata'
import { nearbyTerms } from '@/lib/terms'

export async function generateMetadata(): Promise<Metadata> {
  return privateMetadata('Welcome', await getSiteSettings())
}

export default async function OnboardingPage({ searchParams }: PageProps<'/onboarding'>) {
  const params = await searchParams
  const next = safeNextPath(typeof params.next === 'string' ? params.next : null)
  await requireUser('/onboarding')
  const [profile, programs, settings] = await Promise.all([getCurrentProfile(), getPrograms(), getSiteSettings()])
  if (profile?.onboarding_completed) redirect(next)

  const firstName = profile?.full_name?.split(' ')[0]
  return (
    <div className="w-full max-w-md">
      <h1 className="text-h2 font-semibold text-text">Welcome{firstName ? `, ${firstName}` : ''}!</h1>
      <p className="mt-2 text-muted">Tell us where you are so we can show the right courses and deadlines first.</p>
      <OnboardingForm
        programs={programs.map((p) => ({ id: p.id, name: p.name, shortName: p.shortName }))}
        terms={nearbyTerms(settings.current_term)}
        defaultTerm={profile?.current_term ?? settings.current_term}
        next={next}
      />
    </div>
  )
}
