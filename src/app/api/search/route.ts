import { after, type NextRequest } from 'next/server'

import { recordSearch } from '@/lib/analytics/server'
import { searchSite } from '@/lib/data/search'

/**
 * GET /api/search?q=…&source=dialog — used by the search dialog. The query is
 * logged server-side (search_query / search_zero_results) after responding.
 */
export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get('q') ?? '').trim().slice(0, 200)
  const source = request.nextUrl.searchParams.get('source') === 'dialog' ? 'dialog' : 'api'

  if (query.length < 2) {
    return Response.json({ searchId: null, directHit: null, alternatives: [], results: [] })
  }

  const response = await searchSite(query, 12)
  const searchId = crypto.randomUUID()

  after(async () => {
    await recordSearch({
      id: searchId,
      query,
      normalized: response.parsed.normalized,
      resultsCount: response.results.length,
      source,
      parsed: {
        text: response.parsed.text,
        week: response.parsed.week,
        kind: response.parsed.kind,
        course: response.parsed.course?.slug ?? null,
      },
    })
  })

  return Response.json(
    {
      searchId,
      directHit: response.directHit,
      alternatives: response.alternatives,
      results: response.results,
    },
    { headers: { 'Cache-Control': 'private, no-store' } },
  )
}
