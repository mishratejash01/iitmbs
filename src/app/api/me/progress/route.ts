import { z } from 'zod'

import { getSessionUser } from '@/lib/auth/session'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const itemSchema = z.object({
  item_type: z.enum(['week', 'assignment', 'note']),
  item_id: z.uuid(),
})
const noStore = { 'Cache-Control': 'private, no-store' }

/** GET ?ids=a,b,c → the ids the signed-in student has completed. */
export async function GET(request: Request) {
  const ids = (new URL(request.url).searchParams.get('ids') ?? '')
    .split(',')
    .filter((id) => z.uuid().safeParse(id).success)
    .slice(0, 50)
  const user = await getSessionUser()
  if (!user || ids.length === 0) return Response.json({ completed: [] }, { headers: noStore })
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('progress').select('item_id').in('item_id', ids)
  return Response.json({ completed: (data ?? []).map((row) => row.item_id) }, { headers: noStore })
}

export async function POST(request: Request) {
  const parsed = itemSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: 'Invalid item' }, { status: 400 })
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'Sign in first' }, { status: 401 })
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from('progress')
    .upsert({ user_id: user.id, ...parsed.data }, { onConflict: 'user_id,item_type,item_id' })
  if (error) return Response.json({ error: 'Could not save progress' }, { status: 500 })
  return Response.json({ done: true }, { status: 201, headers: noStore })
}

export async function DELETE(request: Request) {
  const params = new URL(request.url).searchParams
  const parsed = itemSchema.safeParse({
    item_type: params.get('item_type'),
    item_id: params.get('item_id'),
  })
  if (!parsed.success) return Response.json({ error: 'Invalid item' }, { status: 400 })
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'Sign in first' }, { status: 401 })
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from('progress')
    .delete()
    .eq('item_type', parsed.data.item_type)
    .eq('item_id', parsed.data.item_id)
  if (error) return Response.json({ error: 'Could not update progress' }, { status: 500 })
  return Response.json({ done: false }, { headers: noStore })
}
