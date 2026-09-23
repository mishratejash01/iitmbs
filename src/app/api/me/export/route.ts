import { getSessionUser } from '@/lib/auth/session'
import { getServiceClient } from '@/lib/supabase/admin'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/** "Download my data": everything linked to the signed-in account, as JSON. */
export async function GET() {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'Sign in first' }, { status: 401 })

  const supabase = await createSupabaseServerClient()
  const [profile, bookmarks, history, progress, feedback] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('bookmarks').select('path, title, created_at'),
    supabase
      .from('reading_history')
      .select('path, title, visit_count, first_visited_at, last_visited_at'),
    supabase.from('progress').select('item_type, item_id, completed_at'),
    supabase
      .from('content_feedback')
      .select('path, helpful, comment, created_at')
      .eq('user_id', user.id),
  ])

  const admin = getServiceClient()
  const analytics = admin
    ? await Promise.all([
        admin
          .from('events')
          .select('event_name, path, properties, created_at')
          .eq('user_id', user.id)
          .order('created_at')
          .limit(10000),
        admin
          .from('page_views')
          .select('path, title, engaged_seconds, max_scroll, created_at')
          .eq('user_id', user.id)
          .order('created_at')
          .limit(10000),
        admin
          .from('searches')
          .select('query, results_count, created_at')
          .eq('user_id', user.id)
          .limit(5000),
        admin
          .from('downloads')
          .select('resource_id, page_path, created_at')
          .eq('user_id', user.id)
          .limit(5000),
        admin
          .from('auth_events')
          .select('event_name, provider, created_at')
          .eq('user_id', user.id)
          .limit(5000),
      ])
    : null

  const body = {
    exported_at: new Date().toISOString(),
    account: { id: user.id, email: user.email },
    profile: profile.data,
    bookmarks: bookmarks.data ?? [],
    reading_history: history.data ?? [],
    progress: progress.data ?? [],
    feedback: feedback.data ?? [],
    analytics: analytics
      ? {
          events: analytics[0].data ?? [],
          page_views: analytics[1].data ?? [],
          searches: analytics[2].data ?? [],
          downloads: analytics[3].data ?? [],
          sign_ins: analytics[4].data ?? [],
        }
      : 'unavailable',
  }

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="my-data-${new Date().toISOString().slice(0, 10)}.json"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
