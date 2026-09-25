import { z } from 'zod'

import { allowRequest } from '@/lib/analytics/rate-limit'
import { clientIp, hashIp } from '@/lib/analytics/request'
import { getAnalyticsContext } from '@/lib/analytics/server'
import { NEWSLETTER_SEGMENTS } from '@/lib/blog/segment'
import { getServiceClient } from '@/lib/supabase/admin'

const bodySchema = z.object({
  email: z.email().max(254),
  segment: z.enum(NEWSLETTER_SEGMENTS),
  source_path: z.string().max(500).regex(/^\//),
  source_type: z.string().max(40).nullable().optional(),
  source_entity_id: z.uuid().nullable().optional(),
  source_category: z.string().max(80).nullable().optional(),
})

/**
 * Newsletter sign-ups (rate limited). The first sign-up for an address is
 * kept, with the page and segment it came from; signing up again is a no-op.
 */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: 'Invalid email' }, { status: 400 })

  const db = getServiceClient()
  if (!db) return new Response(null, { status: 204 })

  const ipHash = hashIp(clientIp(request.headers))
  if (!(await allowRequest(ipHash && `newsletter:${ipHash}`, 3600, 10))) {
    return Response.json({ error: 'Too many sign-ups' }, { status: 429 })
  }

  const context = await getAnalyticsContext()
  if (context?.isBot) return new Response(null, { status: 204 })

  const { error } = await db.from('newsletter_subscribers').insert({
    email: parsed.data.email.trim().toLowerCase(),
    segment: parsed.data.segment,
    source_path: parsed.data.source_path,
    source_type: parsed.data.source_type ?? null,
    source_entity_id: parsed.data.source_entity_id ?? null,
    source_category: parsed.data.source_category ?? null,
    user_id: context?.userId ?? null,
    anonymous_id: context?.anonymousId ?? null,
  })
  // 23505: this address has already signed up, which is fine.
  if (error && error.code !== '23505') {
    console.error('[api/newsletter] insert failed:', error.message)
    return Response.json({ error: 'Could not subscribe' }, { status: 500 })
  }
  return new Response(null, { status: 201 })
}
