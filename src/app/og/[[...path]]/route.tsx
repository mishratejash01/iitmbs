import { env } from '@/env'
import { getLinkIndex } from '@/lib/data/links'
import { getSiteSettings } from '@/lib/data/settings'
import { renderOgCard } from '@/lib/og/render'

const EYEBROW: Record<string, string> = {
  program: 'Programme',
  program_week: 'Week by week',
  course: 'Course guide',
  week: 'Weekly study hub',
  assignment: 'Assignment help',
  note: 'Notes',
  page: 'Guide',
  blog_post: 'Blog',
  blog_category: 'Blog',
  pyq_course: 'Previous year papers',
  lecture_course: 'IIT Madras lectures',
  note_course: 'Student notes',
}

/**
 * Social card for any public page: /og/<page path>. Only live URLs from the
 * link index get a specific card, so this cannot render arbitrary text.
 */
export async function GET(_request: Request, { params }: RouteContext<'/og/[[...path]]'>) {
  const { path = [] } = await params
  const pagePath = `/${path.join('/')}`
  const [settings, index] = await Promise.all([getSiteSettings(), getLinkIndex()])
  const entry = pagePath === '/' ? null : index[pagePath]
  const host = new URL(env.siteUrl).host

  return renderOgCard({
    siteName: settings.site_name,
    host,
    theme: settings.theme,
    eyebrow: entry ? (EYEBROW[entry.kind] ?? 'IITM BS') : 'For every IITM BS student',
    title: entry?.title ?? (settings.home.hero_title || settings.tagline || settings.site_name),
    subtitle: entry ? entry.summary : settings.tagline,
  })
}
