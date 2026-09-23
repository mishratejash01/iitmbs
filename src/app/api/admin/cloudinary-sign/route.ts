import { z } from 'zod'

import { features } from '@/env'
import { getCurrentProfile } from '@/lib/auth/session'
import { createUploadSignature } from '@/lib/cloudinary/server'

const bodySchema = z.object({
  folder: z
    .string()
    .regex(/^[a-z0-9/_-]{0,80}$/i)
    .optional(),
  type: z.enum(['upload', 'authenticated']).optional(),
})

/** Signs a direct browser upload to Cloudinary. Editors and admins only. */
export async function POST(request: Request) {
  const profile = await getCurrentProfile()
  if (!profile || (profile.role !== 'editor' && profile.role !== 'admin')) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!features.cloudinary) {
    return Response.json(
      {
        error:
          'Uploads are disabled: set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.',
      },
      { status: 503 },
    )
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) return Response.json({ error: 'Invalid request' }, { status: 400 })
  return Response.json(createUploadSignature(parsed.data), {
    headers: { 'Cache-Control': 'private, no-store' },
  })
}
