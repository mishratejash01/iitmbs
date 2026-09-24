import { z } from 'zod'

import { sanitizeThemeOverrides, type ThemeOverrides } from '@/lib/theme/tokens'

/**
 * Shape of `site_settings.data`. Every key has a safe fallback so the site
 * renders even if the row is missing, partially filled or the database is
 * unreachable. Admins edit these values in /admin/settings.
 */

// A leaf that always yields a value: invalid input falls back, missing input
// defaults.
const text = (fallback = '') => z.string().trim().catch(fallback).default(fallback)
const flag = (fallback: boolean) => z.boolean().catch(fallback).default(fallback)
const int = (fallback: number, min: number, max: number) =>
  z.number().int().min(min).max(max).catch(fallback).default(fallback)
const httpsUrl = () =>
  z
    .union([z.literal(''), z.url({ protocol: /^https$/ })])
    .catch('')
    .default('')
const internalOrHttps = () =>
  z
    .string()
    .regex(/^(\/[^\s]*|https:\/\/\S+)$/)
    .catch('')
    .default('')

// An object section: anything that is not a plain object becomes {}, so every
// leaf default applies (Zod 4 does not parse .default() values).
const section = <T extends z.ZodRawShape>(shape: T) =>
  z.preprocess(
    (value) => (value && typeof value === 'object' && !Array.isArray(value) ? value : {}),
    z.object(shape),
  )

export const siteSettingsSchema = section({
  site_name: text('Qualifier Hub'),
  tagline: text(''),
  description: text(''),
  base_url: text(''),
  locale: text('en-IN'),
  current_term: z
    .string()
    .regex(/^\d{4}-(jan|may|sep)$/)
    .nullable()
    .catch(null)
    .default(null),
  revalidate_seconds: int(3600, 60, 604800),
  // Missing or malformed themes become {} (defaults); only valid hex tokens survive.
  theme: z.preprocess(
    (value) => sanitizeThemeOverrides(value),
    z.custom<ThemeOverrides>(() => true),
  ),
  social: section({
    telegram: httpsUrl(),
    whatsapp: httpsUrl(),
    youtube: httpsUrl(),
    instagram: httpsUrl(),
    x: httpsUrl(),
    github: httpsUrl(),
  }),
  verification: section({ google: text(), bing: text(), yandex: text() }),
  contact: section({
    email: z
      .union([z.literal(''), z.email()])
      .catch('')
      .default(''),
    grievance_officer: text(),
  }),
  organization: section({
    name: text(''),
    legal_name: text(''),
    logo_public_id: text(''),
    founding_date: text(''),
  }),
  features: section({
    login: flag(true),
    pwa: flag(true),
    search: flag(true),
    bookmarks: flag(true),
    feedback: flag(true),
    share: flag(true),
    downloads: flag(true),
  }),
  announcement: section({
    enabled: flag(false),
    text: text(''),
    href: internalOrHttps(),
    tone: z.enum(['info', 'warning', 'success']).catch('info').default('info'),
  }),
  home: section({
    hero_title: text(''),
    hero_subtitle: text(''),
    popular_paths: z
      .array(z.string().regex(/^\/[^\s]*$/))
      .max(24)
      .catch([])
      .default([]),
  }),
  seo: section({
    title_template: text('%s | {site_name}'),
    default_title: text(''),
    default_description: text(''),
    templates: z.record(z.string(), z.string()).catch({}).default({}),
    description_templates: z.record(z.string(), z.string()).catch({}).default({}),
  }),
  // Official qualifier rules used by the calculators and guide components.
  // Kept in the database so a rule change is an admin edit, not a deploy.
  qualifier: section({
    ga_rule: section({
      best_of: int(2, 1, 12),
      first_weeks: int(3, 1, 12),
    }),
    categories: z
      .array(
        z.object({
          id: z.string().regex(/^[a-z0-9_]+$/),
          label: z.string().min(1),
          ga_min: z.number().min(0).max(100),
          course_min: z.number().min(0).max(100),
          average_min: z.number().min(0).max(100),
        }),
      )
      .max(12)
      .catch([])
      .default([]),
    course_load: z
      .array(
        z.object({
          from: z.number().min(0).max(100),
          to: z.number().min(0).max(100),
          courses: z.number().int().min(0).max(12),
        }),
      )
      .max(12)
      .catch([])
      .default([]),
    source_url: httpsUrl(),
    verified_on: text(''),
  }),
  analytics: section({
    retention_months: int(13, 1, 60),
    timezone: text('Asia/Kolkata'),
    heartbeat_seconds: int(15, 5, 120),
  }),
  content: section({
    min_words_warning: int(300, 0, 100000),
    stale_days: int(90, 1, 3650),
    indexnow_enabled: flag(true),
  }),
})

export type SiteSettings = z.infer<typeof siteSettingsSchema>

/** Parses an untrusted settings document. Never throws. */
export function parseSiteSettings(data: unknown): SiteSettings {
  const result = siteSettingsSchema.safeParse(data)
  return result.success ? result.data : siteSettingsSchema.parse({})
}

/** Settings used when the database cannot be reached. */
export const fallbackSettings: SiteSettings = siteSettingsSchema.parse({})
