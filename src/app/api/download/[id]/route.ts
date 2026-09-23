import { after } from 'next/server'
import { z } from 'zod'

import { features } from '@/env'
import { getAnalyticsContext } from '@/lib/analytics/server'
import { getSessionUser } from '@/lib/auth/session'
import { privateDownloadUrl } from '@/lib/cloudinary/server'
import { getDownloadTarget } from '@/lib/data/resources'
import { getServiceClient } from '@/lib/supabase/admin'

/**
 * Every download and resource link goes through here so it is counted
 * server-side (download_complete + resources.download_count) before a 302 to
 * the file or external page. Login-only resources send visitors to /login.
 */
export async function GET(request: Request, { params }: RouteContext<'/api/download/[id]'>) {
  const { id } = await params
  if (!z.uuid().safeParse(id).success) return new Response('Not found', { status: 404 })

  const target = await getDownloadTarget(id)
  if (!target) return new Response('Not found', { status: 404 })

  const referer = request.headers.get('referer')
  let pagePath: string | null = null
  try {
    pagePath = referer ? new URL(referer).pathname : null
  } catch {
    pagePath = null
  }

  if (target.requiresLogin && !(await getSessionUser())) {
    const next = pagePath ?? '/resources'
    return Response.redirect(new URL(`/login?next=${encodeURIComponent(next)}`, request.url), 302)
  }

  let destination: string | null = null
  if (target.cloudinaryPublicId && features.cloudinary) {
    const db = getServiceClient()
    const { data: media } = db
      ? await db
          .from('media')
          .select('delivery_type, format')
          .eq('public_id', target.cloudinaryPublicId)
          .maybeSingle()
      : { data: null }
    destination = privateDownloadUrl({
      publicId: target.cloudinaryPublicId,
      resourceType: target.cloudinaryResourceType ?? (target.kind === 'pdf' ? 'raw' : 'image'),
      deliveryType: media?.delivery_type === 'upload' ? 'upload' : 'authenticated',
      format: media?.format ?? target.fileFormat,
    })
  } else if (target.url) {
    destination = target.url
  }
  if (!destination) {
    return new Response('This file is temporarily unavailable.', { status: 503 })
  }

  after(async () => {
    const db = getServiceClient()
    const context = await getAnalyticsContext()
    if (!db || !context || context.isBot) return
    await db.rpc('record_download', {
      p_resource_id: target.id,
      p_context: { ...context.ingest, page_path: pagePath },
    })
  })

  return new Response(null, {
    status: 302,
    headers: {
      Location: destination,
      'Cache-Control': 'private, no-store',
      'Referrer-Policy': 'no-referrer',
    },
  })
}
