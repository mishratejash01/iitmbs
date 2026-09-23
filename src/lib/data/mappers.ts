import type { Json } from '@/lib/supabase/database.types'

import type { AuthorRef, Faq, ProgramRef, ResourceItem, SeoFields } from './types'

/** Columns every publishable table carries for SEO. */
export const SEO_COLUMNS =
  'seo_title, seo_description, og_image_public_id, canonical_path, noindex, keywords, schema_overrides'

type SeoRow = {
  seo_title: string | null
  seo_description: string | null
  og_image_public_id: string | null
  canonical_path: string | null
  noindex: boolean
  keywords: string[]
  schema_overrides: Json
}

export function isJsonObject(
  value: Json | undefined,
): value is { [key: string]: Json | undefined } {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function toSeo(row: SeoRow): SeoFields {
  return {
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    ogImagePublicId: row.og_image_public_id,
    canonicalPath: row.canonical_path,
    noindex: row.noindex,
    keywords: row.keywords ?? [],
    schemaOverrides: isJsonObject(row.schema_overrides) ? row.schema_overrides : {},
  }
}

export function toProgramRef(row: {
  id: string
  slug: string
  name: string
  short_name: string
}): ProgramRef {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortName: row.short_name,
    path: `/${row.slug}`,
  }
}

export function toFaq(row: { id: string; question: string; answer_mdx: string }): Faq {
  return { id: row.id, question: row.question, answerMdx: row.answer_mdx }
}

export function toAuthor(row: {
  id: string
  slug: string
  name: string
  headline: string | null
  credentials: string | null
  avatar_public_id: string | null
  same_as: string[]
}): AuthorRef {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    headline: row.headline,
    credentials: row.credentials,
    avatarPublicId: row.avatar_public_id,
    sameAs: row.same_as ?? [],
  }
}

export const RESOURCE_COLUMNS =
  'id, kind, title, description, url, cloudinary_public_id, file_format, file_bytes, requires_login, download_count, course_id, week_id, sort_order'

export function toResource(row: {
  id: string
  kind: 'pdf' | 'sheet' | 'link' | 'video'
  title: string
  description: string | null
  url: string | null
  cloudinary_public_id: string | null
  file_format: string | null
  file_bytes: number | null
  requires_login: boolean
  download_count: number
}): ResourceItem {
  let host: string | null = null
  if (row.url) {
    try {
      host = new URL(row.url).hostname.replace(/^www\./, '')
    } catch {
      host = null
    }
  }
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    description: row.description,
    requiresLogin: row.requires_login,
    fileFormat: row.file_format,
    fileBytes: row.file_bytes,
    // Links go to another site; uploaded files are served through /api/download.
    isExternal: !row.cloudinary_public_id && row.url !== null,
    host,
    downloadCount: Number(row.download_count ?? 0),
  }
}
