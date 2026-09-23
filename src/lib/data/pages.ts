import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'

import { tableTag } from '@/lib/cache/tags'
import { getPublicClient } from '@/lib/supabase/public'

import { getAuthorsByIds } from './authors'
import { SEO_COLUMNS, toFaq, toSeo } from './mappers'
import { contentCacheProfile } from './settings'
import type { AuthorRef, Faq, SeoFields } from './types'

export type PageSource = { title: string; url: string }

export type CmsPage = {
  id: string
  path: string
  title: string
  summary: string | null
  bodyMdx: string
  sources: PageSource[]
  template: 'default' | 'legal' | 'guide'
  lastReviewedAt: string | null
  publishedAt: string | null
  updatedAt: string
  seo: SeoFields
  author: AuthorRef | null
  reviewer: AuthorRef | null
  faqs: Faq[]
}

export type PageLink = { path: string; title: string; summary: string | null }

export function toSources(value: unknown): PageSource[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) =>
    item &&
    typeof item === 'object' &&
    typeof item.title === 'string' &&
    typeof item.url === 'string' &&
    /^https:\/\//.test(item.url)
      ? [{ title: item.title, url: item.url }]
      : [],
  )
}

export async function getPage(path: string): Promise<CmsPage | null> {
  'use cache'
  cacheLife(await contentCacheProfile())
  cacheTag(tableTag('pages'), tableTag('faqs'), tableTag('authors'))

  const db = getPublicClient()
  const { data, error } = await db
    .from('pages')
    .select(
      `id, path, title, summary, body_mdx, sources, template, author_id, reviewer_id, last_reviewed_at, published_at, updated_at, ${SEO_COLUMNS}`,
    )
    .eq('path', path)
    .maybeSingle()

  if (error) console.error('[data/pages] page failed:', error.message)
  if (!data) return null

  const [authors, faqs] = await Promise.all([
    getAuthorsByIds([data.author_id, data.reviewer_id].filter((id): id is string => Boolean(id))),
    db
      .from('faqs')
      .select('id, question, answer_mdx')
      .eq('scope', 'page')
      .eq('scope_id', data.id)
      .order('sort_order'),
  ])
  if (faqs.error) console.error('[data/pages] faqs failed:', faqs.error.message)

  return {
    id: data.id,
    path: data.path,
    title: data.title,
    summary: data.summary,
    bodyMdx: data.body_mdx,
    sources: toSources(data.sources),
    template: data.template as CmsPage['template'],
    lastReviewedAt: data.last_reviewed_at,
    publishedAt: data.published_at,
    updatedAt: data.updated_at,
    seo: toSeo(data),
    author: data.author_id ? (authors[data.author_id] ?? null) : null,
    reviewer: data.reviewer_id ? (authors[data.reviewer_id] ?? null) : null,
    faqs: (faqs.data ?? []).map(toFaq),
  }
}

/** Live pages directly under a path prefix, e.g. the "qualifier" guides. */
export async function getChildPages(prefix: string): Promise<PageLink[]> {
  'use cache'
  cacheLife(await contentCacheProfile())
  cacheTag(tableTag('pages'))

  const { data, error } = await getPublicClient()
    .from('pages')
    .select('path, title, summary')
    .like('path', `${prefix}/%`)
    .not('path', 'like', `${prefix}/%/%`)
    .order('sort_order')

  if (error) {
    console.error('[data/pages] children failed:', error.message)
    return []
  }
  return data.map((row) => ({ path: `/${row.path}`, title: row.title, summary: row.summary }))
}

/** Every live page path under a prefix — for generateStaticParams. */
export async function getPagePaths(prefix: string): Promise<string[]> {
  const children = await getChildPages(prefix)
  return children.map((child) => child.path.slice(prefix.length + 2))
}
