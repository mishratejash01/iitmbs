import type { Metadata } from 'next'

import { env } from '@/env'
import { cloudinaryImageUrl } from '@/lib/cloudinary/url'
import type { SeoOverride } from '@/lib/data/seo-overrides'
import type { SeoFields } from '@/lib/data/types'
import { truncate } from '@/lib/mdx/plain'
import { absoluteUrl } from '@/lib/routes'
import type { SiteSettings } from '@/lib/settings/schema'

import { fillTemplate, type TemplateVars } from './templates'
import { fitTitle } from './title'

export type PageSeoInput = {
  settings: SiteSettings
  /** Canonical, site-relative path of the page. */
  path: string
  /** Settings template key, e.g. "graded_assignment". */
  template?: string
  vars?: TemplateVars
  /** Used when there is no template or it cannot be filled. */
  fallbackTitle: string
  /**
   * Shorter titles, best first, for when the full one is longer than
   * TITLE_LIMIT (see ./title) even without the brand suffix. Never applied to titles an
   * admin wrote (overrides and per-entity SEO titles).
   */
  shortTitles?: string[]
  fallbackDescription: string
  /** Used when the entity has no keywords of its own. */
  keywords?: string[]
  /** Per-entity SEO fields from the database (take precedence). */
  seo?: SeoFields | null
  /** Admin override for this exact path (applied last). */
  override?: SeoOverride | null
  noindex?: boolean
  type?: 'website' | 'article'
  publishedTime?: string | null
  modifiedTime?: string | null
}

const DESCRIPTION_LIMIT = 160

function canonicalFor(input: PageSeoInput): string {
  const explicit = input.override?.canonical ?? input.seo?.canonicalPath
  if (explicit) return /^https?:\/\//.test(explicit) ? explicit : absoluteUrl(env.siteUrl, explicit)
  return absoluteUrl(env.siteUrl, input.path)
}

export function resolveTitle(input: PageSeoInput): string {
  const vars = { site_name: input.settings.site_name, ...input.vars }
  const admin = input.override?.title || input.seo?.seoTitle
  const title =
    admin ||
    fillTemplate(
      input.template ? input.settings.seo.templates[input.template] : null,
      vars,
      input.fallbackTitle,
    )
  return fitTitle(title, input.settings.site_name, admin ? [] : (input.shortTitles ?? []))
}

export function resolveDescription(input: PageSeoInput): string {
  const vars = { site_name: input.settings.site_name, ...input.vars }
  const text =
    input.override?.description ||
    input.seo?.seoDescription ||
    fillTemplate(
      input.template ? input.settings.seo.description_templates[input.template] : null,
      vars,
      input.fallbackDescription,
    )
  return truncate(text, DESCRIPTION_LIMIT)
}

/**
 * Builds complete metadata for a public page: absolute self-referencing
 * canonical, robots, en-IN alternate, Open Graph and Twitter cards. Titles are
 * absolute (templates already include the brand suffix).
 */
export function buildMetadata(input: PageSeoInput): Metadata {
  const title = resolveTitle(input)
  const description = resolveDescription(input)
  const url = canonicalFor(input)
  const noindex = Boolean(input.override?.noindex ?? (input.noindex || input.seo?.noindex))
  const keywords = input.seo?.keywords?.length
    ? input.seo.keywords
    : input.keywords?.length
      ? input.keywords
      : undefined
  // An admin-chosen Cloudinary image wins; otherwise the generated card.
  const customImage = input.override?.ogImagePublicId ?? input.seo?.ogImagePublicId
  const image = {
    url: customImage
      ? cloudinaryImageUrl(customImage, { width: 1200, height: 630, crop: 'fill' })
      : absoluteUrl(env.siteUrl, `/og${input.path === '/' ? '' : input.path}`),
    width: 1200,
    height: 630,
    alt: title,
  }

  return {
    title: { absolute: title },
    description,
    keywords,
    alternates: { canonical: url, languages: { 'en-IN': url } },
    robots: noindex
      ? { index: false, follow: true, googleBot: { index: false, follow: true } }
      : {
          index: true,
          follow: true,
          googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
        },
    openGraph: {
      type: input.type ?? 'website',
      url,
      siteName: input.settings.site_name,
      title,
      description,
      locale: 'en_IN',
      images: [image],
      ...(input.type === 'article'
        ? {
            publishedTime: input.publishedTime ?? undefined,
            modifiedTime: input.modifiedTime ?? undefined,
          }
        : {}),
    },
    twitter: { card: 'summary_large_image', title, description, images: [image.url] },
  }
}

/** Metadata for pages that must never be indexed (search, auth, dashboard). */
export function privateMetadata(title: string, settings: SiteSettings): Metadata {
  return {
    title: { absolute: `${title} | ${settings.site_name}` },
    robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  }
}
