import { getContentPerformance } from '@/lib/admin/analytics'
import { csvCell } from '@/lib/admin/csv'
import { resolveRange, todayIn } from '@/lib/admin/range'
import { getCurrentProfile } from '@/lib/auth/session'
import { getSiteSettings } from '@/lib/data/settings'

const COLUMNS = [
  'path',
  'title',
  'page_type',
  'views',
  'visitors',
  'avg_engaged_seconds',
  'scroll_completion',
  'bounce_rate',
  'helpful_yes',
  'helpful_no',
  'downloads',
] as const

/** Content performance for a date range as CSV. Admins only. */
export async function GET(request: Request) {
  const profile = await getCurrentProfile()
  if (profile?.role !== 'admin') return new Response('Not found', { status: 404 })

  const url = new URL(request.url)
  const settings = await getSiteSettings()
  const range = resolveRange(
    {
      range: url.searchParams.get('range') ?? undefined,
      from: url.searchParams.get('from') ?? undefined,
      to: url.searchParams.get('to') ?? undefined,
    },
    todayIn(settings.analytics.timezone),
  )
  const rows = await getContentPerformance(range, 5000)
  const lines = [
    COLUMNS.join(','),
    ...rows.map((row) => COLUMNS.map((column) => csvCell(row[column])).join(',')),
  ]

  return new Response(`﻿${lines.join('\r\n')}\r\n`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="content-performance-${range.from}-to-${range.to}.csv"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
