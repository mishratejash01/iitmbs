import { z } from 'zod'

import { getSessionUser } from '@/lib/auth/session'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const pathSchema = z
  .string()
  .max(500)
  .regex(/^\/[^\s]*$/)
const bodySchema = z.object({
  path: pathSchema,
  title: z.string().trim().min(1).max(200),
  entity_type: z
    .enum(['program', 'course', 'week', 'assignment', 'note', 'page', 'resource'])
    .nullable()
    .optional(),
  entity_id: z.uuid().nullable().optional(),
})

const noStore = { 'Cache-Control': 'private, no-store' }

/** GET ?path=… → { bookmarked } for the signed-in user. */
export async function GET(request: Request) {
  const path = pathSchema.safeParse(new URL(request.url).searchParams.get('path'))
  const user = await getSessionUser()
  if (!user || !path.success)
    return Response.json({ bookmarked: false, signedIn: Boolean(user) }, { headers: noStore })
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('bookmarks').select('id').eq('path', path.data).maybeSingle()
  return Response.json({ bookmarked: Boolean(data), signedIn: true }, { headers: noStore })
}

/** POST adds a bookmark (RLS ties it to the caller). */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: 'Invalid bookmark' }, { status: 400 })
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'Sign in to bookmark' }, { status: 401 })
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('bookmarks').upsert(
    {
      user_id: user.id,
      path: parsed.data.path,
      title: parsed.data.title,
      entity_type: parsed.data.entity_type ?? null,
      entity_id: parsed.data.entity_id ?? null,
    },
    { onConflict: 'user_id,path' },
  )
  if (error) return Response.json({ error: 'Could not save bookmark' }, { status: 500 })
  return Response.json({ bookmarked: true }, { status: 201, headers: noStore })
}

/** DELETE ?path=… removes a bookmark. */
export async function DELETE(request: Request) {
  const path = pathSchema.safeParse(new URL(request.url).searchParams.get('path'))
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'Sign in first' }, { status: 401 })
  if (!path.success) return Response.json({ error: 'Invalid path' }, { status: 400 })
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('bookmarks').delete().eq('path', path.data)
  if (error) return Response.json({ error: 'Could not remove bookmark' }, { status: 500 })
  return Response.json({ bookmarked: false }, { headers: noStore })
}
