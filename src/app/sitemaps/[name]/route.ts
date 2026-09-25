import { env } from '@/env'
import { getSitemapEntries, SITEMAP_SECTIONS, type SitemapSection } from '@/lib/data/sitemap'
import { absoluteUrl } from '@/lib/routes'
import { urlsetXml, XML_HEADERS } from '@/lib/seo/sitemap-xml'

export function generateStaticParams() {
  return SITEMAP_SECTIONS.map((section) => ({ name: `${section}.xml` }))
}

/** One child sitemap: only live, indexable URLs of a single content type. */
export async function GET(_request: Request, { params }: RouteContext<'/sitemaps/[name]'>) {
  const { name } = await params
  const section = name.replace(/\.xml$/, '') as SitemapSection
  if (!SITEMAP_SECTIONS.includes(section)) return new Response('Not found', { status: 404 })

  const all = await getSitemapEntries()
  const entries = all.filter((e) => e.section === section)
  const urls = entries.map((e) => ({
    url: absoluteUrl(env.siteUrl, e.path),
    lastModified: e.lastModified,
  }))
  const newest = (list: typeof all) =>
    list.reduce(
      (latest, e) => (e.lastModified > latest ? e.lastModified : latest),
      '1970-01-01T00:00:00Z',
    )
  // Pages that live in code rather than in a table, dated by the content they list.
  if (section === 'pages') {
    urls.unshift(
      { url: absoluteUrl(env.siteUrl, '/'), lastModified: newest(entries) },
      { url: absoluteUrl(env.siteUrl, '/resources'), lastModified: newest(all) },
    )
    const assignments = all.filter((e) => e.section === 'assignments')
    // The graded assignments hub is thin (and noindex) until a week is published.
    if (assignments.length > 0) {
      urls.push({
        url: absoluteUrl(env.siteUrl, '/graded-assignments'),
        lastModified: newest(assignments),
      })
    }
  }
  if (section === 'lectures' && entries.length > 0) {
    urls.unshift({
      url: absoluteUrl(env.siteUrl, '/resources/lectures'),
      lastModified: newest(entries),
    })
  }
  return new Response(urlsetXml(urls), { headers: XML_HEADERS })
}
