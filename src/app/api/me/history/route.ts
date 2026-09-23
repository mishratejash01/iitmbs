import { cookies } from 'next/headers'
import { z } from 'zod'

import { ANALYTICS_COOKIES } from '@/lib/analytics/events'
import { getSessionUser } from '@/lib/auth/session'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const bodySchema = z.object({
  path: z.string().max(500).regex(/^\/[^\s]*$/),
  title: z.string().trim().min(1).max(200),
  entity_type: z.enum(['program', 'course', 'week', 'assignment', 'note', 'page', 'resource']).nullable().optional(),
  entity_id: z.uuid().nullable().optional(),
})

/** Records reading history — only for signed-in users with detailed consent. */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return new Response(null, { status: 400 })
  const cookieStore = await cookies()
  if (cookieStore.get(ANALYTICS_COOKIES.consent)?.value !== 'detailed') return new Response(null, { status: 204 })
  const user = await getSessionUser()
  if (!user) return new Response(null, { status: 204 })

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.rpc('record_reading', {
    p_path: parsed.data.path,
    p_title: parsed.data.title,
    p_entity_type: parsed.data.entity_type ?? undefined,
    p_entity_id: parsed.data.entity_id ?? undefined,
  })
  if (error) console.error('[api/me/history] failed:', error.message)
  return new Response(null, { status: 204 })
}
