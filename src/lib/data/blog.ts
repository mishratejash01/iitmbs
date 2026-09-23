import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'

import { tableTag } from '@/lib/cache/tags'
import { blogCategoryPath, blogPostPath } from '@/lib/routes'
import { getPublicClient } from '@/lib/supabase/public'

import { getAuthorsByIds } from './authors'
import { SEO_COLUMNS, toSeo } from './mappers'
import { toSources, type PageSource } from './pages'
import { contentCacheProfile } from './settings'
import type { AuthorRef, SeoFields } from './types'

export type BlogCategory = {
  id: string
  slug: string
  name: string
  description: string | null
  introMdx: string
  path: string
  updatedAt: string
  seo: SeoFields
}

export type BlogPostSummary = {
  id: string
  slug: string
  path: string
  title: string
  summary: string | null
  category: { id: string; slug: string; name: string; path: string }
  program: { slug: string; shortName: string } | null
  tags: string[]
  isFeatured: boolean
  sortOrder: number
  readingMinutes: number
  publishedAt: string | null
  updatedAt: string
}

export type BlogPost = BlogPostSummary & {
  bodyMdx: string
  sources: PageSource[]
  wordCount: number
  lastReviewedAt: string | null
  seo: SeoFields
  author: AuthorRef | null
  reviewer: AuthorRef | null
}

const blogTags = () => [tableTag('blog_posts'), tableTag('blog_categories'), tableTag('programs')]

/** Live categories in their display order. */
export async function getBlogCategories(): Promise<BlogCategory[]> {
  'use cache'
  cacheLife(await contentCacheProfile())
  cacheTag(tableTag('blog_categories'))

  const { data, error } = await getPublicClient()
    .from('blog_categories')
    .select(`id, slug, name, description, intro_mdx, updated_at, ${SEO_COLUMNS}`)
    .order('sort_order')
    .order('name')

  if (error) {
    console.error('[data/blog] categories failed:', error.message)
    return []
  }
  return data.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    introMdx: row.intro_mdx,
    path: blogCategoryPath(row.slug),
    updatedAt: row.updated_at,
    seo: toSeo(row),
  }))
}

/**
 * Every live post without its body, newest first. Small enough to load whole:
 * the index, category pages, related posts and the feed all read from it.
 * The inner join drops posts whose category is not live.
 */
export async function getBlogPostIndex(): Promise<BlogPostSummary[]> {
  'use cache'
  cacheLife(await contentCacheProfile())
  cacheTag(...blogTags())

  const { data, error } = await getPublicClient()
    .from('blog_posts')
    .select(
      `id, slug, title, summary, tags, is_featured, sort_order, reading_time_minutes, published_at, updated_at,
       category:blog_categories!inner(id, slug, name),
       program:programs(slug, short_name)`,
    )
    .order('published_at', { ascending: false })
    .order('title')

  if (error) {
    console.error('[data/blog] index failed:', error.message)
    return []
  }
  return data.map((row) => ({
    id: row.id,
    slug: row.slug,
    path: blogPostPath(row.slug),
    title: row.title,
    summary: row.summary,
    category: { ...row.category, path: blogCategoryPath(row.category.slug) },
    program: row.program ? { slug: row.program.slug, shortName: row.program.short_name } : null,
    tags: row.tags ?? [],
    isFeatured: row.is_featured,
    sortOrder: row.sort_order,
    readingMinutes: row.reading_time_minutes,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
  }))
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  'use cache'
  cacheLife(await contentCacheProfile())
  cacheTag(...blogTags(), tableTag('authors'))

  const summary = (await getBlogPostIndex()).find((post) => post.slug === slug)
  if (!summary) return null

  const { data, error } = await getPublicClient()
    .from('blog_posts')
    .select(
      `body_mdx, sources, word_count, author_id, reviewer_id, last_reviewed_at, ${SEO_COLUMNS}`,
    )
    .eq('id', summary.id)
    .maybeSingle()

  if (error) console.error('[data/blog] post failed:', error.message)
  if (!data) return null

  const authors = await getAuthorsByIds(
    [data.author_id, data.reviewer_id].filter((id): id is string => Boolean(id)),
  )
  return {
    ...summary,
    bodyMdx: data.body_mdx,
    sources: toSources(data.sources),
    wordCount: data.word_count,
    lastReviewedAt: data.last_reviewed_at,
    seo: toSeo(data),
    author: data.author_id ? (authors[data.author_id] ?? null) : null,
    reviewer: data.reviewer_id ? (authors[data.reviewer_id] ?? null) : null,
  }
}

/**
 * Posts to read next: shared tags count most, then the same category, then
 * the same programme. Ties go to the newer post.
 */
export function relatedPosts(
  post: BlogPostSummary,
  all: BlogPostSummary[],
  limit = 6,
): BlogPostSummary[] {
  const tags = new Set(post.tags)
  return all
    .filter((other) => other.id !== post.id)
    .map((other) => ({
      other,
      score:
        other.tags.filter((tag) => tags.has(tag)).length * 3 +
        (other.category.id === post.category.id ? 2 : 0) +
        (post.program && other.program?.slug === post.program.slug ? 1 : 0),
    }))
    .filter(({ score }) => score > 0)
    .sort(
      (a, b) =>
        b.score - a.score || (b.other.publishedAt ?? '').localeCompare(a.other.publishedAt ?? ''),
    )
    .slice(0, limit)
    .map(({ other }) => other)
}

/** Posts in a category: pinned order first, then newest. */
export function postsInCategory(all: BlogPostSummary[], categoryId: string): BlogPostSummary[] {
  return all
    .filter((post) => post.category.id === categoryId)
    .sort(
      (a, b) =>
        a.sortOrder - b.sortOrder || (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''),
    )
}
