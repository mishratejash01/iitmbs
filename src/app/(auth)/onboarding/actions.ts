'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'

import { recordServerEvents } from '@/lib/analytics/server'
import { safeNextPath } from '@/lib/auth/safe-next'
import { getSessionUser } from '@/lib/auth/session'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const schema = z.object({
  program_id: z.uuid(),
  current_term: z.string().regex(/^\d{4}-(jan|may|sep)$/),
  marketing_consent: z.literal('on').optional(),
  next: z.string().optional(),
})

export type OnboardingState = { error: string | null }

export async function completeOnboarding(_state: OnboardingState, formData: FormData): Promise<OnboardingState> {
  const user = await getSessionUser()
  if (!user) redirect('/login?next=/onboarding')

  const parsed = schema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Please choose your programme and term.' }

  const supabase = await createSupabaseServerClient()
  const { data: program } = await supabase.from('programs').select('slug').eq('id', parsed.data.program_id).maybeSingle()
  if (!program) return { error: 'Please choose a valid programme.' }

  const { error } = await supabase
    .from('profiles')
    .update({
      program_id: parsed.data.program_id,
      current_term: parsed.data.current_term,
      marketing_consent: parsed.data.marketing_consent === 'on',
      onboarding_completed: true,
    })
    .eq('id', user.id)
  if (error) return { error: 'Could not save — please try again.' }

  await recordServerEvents(
    [{ name: 'onboarding_complete', path: '/onboarding', props: { program: program.slug, term: parsed.data.current_term } }],
    { userId: user.id },
  )
  redirect(safeNextPath(parsed.data.next, `/${program.slug}`))
}
