import { timingSafeEqual } from 'node:crypto'

import { after } from 'next/server'
import { z } from 'zod'

import { env } from '@/env'
import { getSitemapEntries } from '@/lib/data/sitemap'
import { pingIndexNow } from '@/lib/publishing/indexnow'
import { revalidateTables } from '@/lib/publishing/revalidate'

const bodySchema = z.object({
  tables: z.array(z.string().max(64)).min(1).max(30),
  reason: z.string().max(40).optional(),
  paths: z.array(z.string().regex(/^\//).max(500)).max(1000).optional(),
})

function authorised(request: Request): boolean {
  const secret = env.revalidateSecret
  const header = request.headers.get('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!secret || token.length !== secret.length) return false
  return timingSafeEqual(Buffer.from(token), Buffer.from(secret))
}

/**
 * On-demand revalidation webhook, called by Postgres (pg_net) whenever
 * content changes or a scheduled item / solution release goes live, and by
 * admin tooling. Authenticated with REVALIDATE_SECRET.
 */
export async function POST(request: Request) {
  if (!authorised(request)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: 'Invalid body' }, { status: 400 })

  const { tables, reason, paths } = parsed.data
  // Releases and go-lives must show up on the next request, not after a stale hit.
  const immediate = reason === 'schedule' || reason === 'unpublish'
  const tags = revalidateTables(tables, { immediate })

  after(async () => {
    const changed = paths ?? (await getSitemapEntries()).map((entry) => entry.path)
    if (reason === 'schedule' || reason?.startsWith('publish') || paths) await pingIndexNow(changed)
  })

  return Response.json({ revalidated: tags, immediate })
}
