import { env } from '@/env'
import { getSitemapEntries, SITEMAP_SECTIONS } from '@/lib/data/sitemap'
import { absoluteUrl } from '@/lib/routes'
import { sitemapIndexXml, XML_HEADERS } from '@/lib/seo/sitemap-xml'

/**
 * Sitemap index: one child sitemap per content type, each with the real
 * last-modified time of its newest URL. The home page is in "pages".
 */
export async function GET() {
  const entries = await getSitemapEntries()
  const sitemaps = SITEMAP_SECTIONS.flatMap((section) => {
    const inSection = entries.filter((e) => e.section === section)
    if (section !== 'pages' && inSection.length === 0) return []
    const lastModified = inSection.reduce<string | undefined>(
      (latest, e) => (!latest || e.lastModified > latest ? e.lastModified : latest),
      undefined,
    )
    return [{ url: absoluteUrl(env.siteUrl, `/sitemaps/${section}.xml`), lastModified }]
  })
  return new Response(sitemapIndexXml(sitemaps), { headers: XML_HEADERS })
}
