import { z } from 'zod'

import { allowRequest } from '@/lib/analytics/rate-limit'
import { clientIp, hashIp } from '@/lib/analytics/request'
import { getAnalyticsContext } from '@/lib/analytics/server'
import { getServiceClient } from '@/lib/supabase/admin'

const bodySchema = z.object({
  path: z.string().max(500).regex(/^\//),
  page_type: z.string().max(40).nullable().optional(),
  entity_id: z.uuid().nullable().optional(),
  helpful: z.boolean(),
  comment: z.string().trim().max(1000).nullable().optional(),
})

/** "Was this helpful?" submissions (rate limited, stored for staff triage). */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: 'Invalid feedback' }, { status: 400 })

  const db = getServiceClient()
  if (!db) return new Response(null, { status: 204 })

  const ipKey = hashIp(clientIp(request.headers)) ?? 'noip'
  if (!(await allowRequest(`feedback:${ipKey}`, 3600, 30))) {
    return Response.json({ error: 'Too many submissions' }, { status: 429 })
  }

  const context = await getAnalyticsContext()
  if (context?.isBot) return new Response(null, { status: 204 })

  const { error } = await db.from('content_feedback').insert({
    path: parsed.data.path,
    page_type: parsed.data.page_type ?? null,
    entity_id: parsed.data.entity_id ?? null,
    helpful: parsed.data.helpful,
    comment: parsed.data.comment || null,
    user_id: context?.userId ?? null,
    anonymous_id: context?.anonymousId ?? null,
    session_id: context?.sessionId ?? null,
  })
  if (error) {
    console.error('[api/feedback] insert failed:', error.message)
    return Response.json({ error: 'Could not save feedback' }, { status: 500 })
  }
  return new Response(null, { status: 201 })
}
