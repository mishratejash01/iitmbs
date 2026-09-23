'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { ANALYTICS_COOKIES } from '@/lib/analytics/events'
import { DISPLAY_COOKIE, encodeDisplayUser } from '@/lib/auth/display-cookie'
import { getCurrentProfile, requireUser } from '@/lib/auth/session'
import { getServiceClient } from '@/lib/supabase/admin'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export type ActionState = { ok: boolean; message: string | null }

export async function removeBookmark(formData: FormData) {
  await requireUser('/dashboard/bookmarks')
  const path = z.string().regex(/^\//).safeParse(formData.get('path'))
  if (!path.success) return
  const supabase = await createSupabaseServerClient()
  await supabase.from('bookmarks').delete().eq('path', path.data)
  revalidatePath('/dashboard/bookmarks')
  revalidatePath('/dashboard')
}

export async function clearHistory() {
  const user = await requireUser('/dashboard/history')
  const supabase = await createSupabaseServerClient()
  await supabase.from('reading_history').delete().eq('user_id', user.id)
  revalidatePath('/dashboard/history')
  revalidatePath('/dashboard')
}

const profileSchema = z.object({
  full_name: z.string().trim().min(1).max(120),
  program_id: z.uuid(),
  current_term: z.string().regex(/^\d{4}-(jan|may|sep)$/),
  marketing_consent: z.literal('on').optional(),
})

export async function updateProfile(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser('/dashboard/settings')
  const parsed = profileSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { ok: false, message: 'Please check the highlighted fields.' }
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: parsed.data.full_name,
      program_id: parsed.data.program_id,
      current_term: parsed.data.current_term,
      marketing_consent: parsed.data.marketing_consent === 'on',
    })
    .eq('id', user.id)
  if (error) return { ok: false, message: 'Could not save your profile.' }

  const profile = await getCurrentProfile()
  const cookieStore = await cookies()
  cookieStore.set(
    DISPLAY_COOKIE,
    encodeDisplayUser({
      name: parsed.data.full_name,
      avatar: profile?.avatar_url ?? null,
      staff: profile?.role === 'editor' || profile?.role === 'admin',
    }),
    { path: '/', sameSite: 'lax', secure: true, maxAge: 60 * 60 * 24 * 30 },
  )
  revalidatePath('/dashboard', 'layout')
  return { ok: true, message: 'Profile saved.' }
}

const consentSchema = z.object({ level: z.enum(['essential', 'detailed']), adult: z.literal('on').optional() })

export async function updateConsent(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser('/dashboard/settings')
  const parsed = consentSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { ok: false, message: 'Choose an option.' }
  if (parsed.data.level === 'detailed' && parsed.data.adult !== 'on') {
    return { ok: false, message: 'Detailed analytics are only available if you confirm you are 18 or older.' }
  }
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from('profiles')
    .update({ analytics_consent: parsed.data.level === 'detailed', consent_updated_at: new Date().toISOString() })
    .eq('id', user.id)
  if (error) return { ok: false, message: 'Could not save your choice.' }
  const cookieStore = await cookies()
  cookieStore.set(ANALYTICS_COOKIES.consent, parsed.data.level, {
    path: '/',
    sameSite: 'lax',
    secure: true,
    maxAge: 60 * 60 * 24 * 365,
  })
  revalidatePath('/dashboard/settings')
  return { ok: true, message: parsed.data.level === 'detailed' ? 'Detailed analytics turned on.' : 'Only essential analytics are used now.' }
}

/**
 * Deletes the account and every row linked to it — including pseudonymous
 * analytics from browsers the user signed in on — then signs out.
 */
export async function deleteAccount(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser('/dashboard/settings')
  if (formData.get('confirm') !== 'DELETE') return { ok: false, message: 'Type DELETE to confirm.' }

  const admin = getServiceClient()
  if (!admin) return { ok: false, message: 'Account deletion is temporarily unavailable. Please contact us.' }

  const { data: sessions } = await admin.from('sessions').select('anonymous_id').eq('user_id', user.id)
  const anonymousIds = [...new Set((sessions ?? []).map((s) => s.anonymous_id))]
  if (anonymousIds.length > 0) {
    await Promise.all([
      admin.from('events').delete().in('anonymous_id', anonymousIds),
      admin.from('page_views').delete().in('anonymous_id', anonymousIds),
      admin.from('searches').delete().in('anonymous_id', anonymousIds),
      admin.from('downloads').delete().in('anonymous_id', anonymousIds),
      admin.from('auth_events').delete().in('anonymous_id', anonymousIds),
      admin.from('content_feedback').delete().in('anonymous_id', anonymousIds),
    ])
    await admin.from('sessions').delete().in('anonymous_id', anonymousIds)
  }

  // Cascades to the profile, bookmarks, history, progress and linked analytics.
  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) return { ok: false, message: 'Could not delete the account. Please contact us.' }

  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  const cookieStore = await cookies()
  for (const name of [DISPLAY_COOKIE, ANALYTICS_COOKIES.anonymousId, ANALYTICS_COOKIES.sessionId, ANALYTICS_COOKIES.consent]) {
    cookieStore.delete(name)
  }
  redirect('/?account=deleted')
}
