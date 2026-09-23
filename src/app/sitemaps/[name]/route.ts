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

  const entries = (await getSitemapEntries()).filter((e) => e.section === section)
  const urls = entries.map((e) => ({
    url: absoluteUrl(env.siteUrl, e.path),
    lastModified: e.lastModified,
  }))
  if (section === 'pages') {
    const newest = entries.reduce(
      (latest, e) => (e.lastModified > latest ? e.lastModified : latest),
      '1970-01-01T00:00:00Z',
    )
    urls.unshift({ url: absoluteUrl(env.siteUrl, '/'), lastModified: newest })
  }
  return new Response(urlsetXml(urls), { headers: XML_HEADERS })
}
