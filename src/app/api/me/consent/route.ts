import { z } from 'zod'

import { getSessionUser } from '@/lib/auth/session'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const bodySchema = z.object({ level: z.enum(['essential', 'detailed']), adult: z.boolean().optional() })

/**
 * Stores the analytics choice on the profile of a signed-in user. Detailed
 * analytics are only recorded as granted when the user confirmed they are 18+.
 */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return new Response(null, { status: 400 })

  const user = await getSessionUser()
  if (!user) return new Response(null, { status: 204 })

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from('profiles')
    .update({
      analytics_consent: parsed.data.level === 'detailed' && parsed.data.adult === true,
      consent_updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
  if (error) console.error('[api/me/consent] update failed:', error.message)
  return new Response(null, { status: 204 })
}
