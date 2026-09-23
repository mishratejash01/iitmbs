const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

export function sitemapIndexXml(sitemaps: Array<{ url: string; lastModified?: string }>): string {
  const items = sitemaps
    .map(
      (s) =>
        `  <sitemap>\n    <loc>${escapeXml(s.url)}</loc>${s.lastModified ? `\n    <lastmod>${new Date(s.lastModified).toISOString()}</lastmod>` : ''}\n  </sitemap>`,
    )
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</sitemapindex>\n`
}

export function urlsetXml(urls: Array<{ url: string; lastModified: string }>): string {
  const items = urls
    .map(
      (u) =>
        `  <url>\n    <loc>${escapeXml(u.url)}</loc>\n    <lastmod>${new Date(u.lastModified).toISOString()}</lastmod>\n  </url>`,
    )
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</urlset>\n`
}

export const XML_HEADERS = {
  'Content-Type': 'application/xml; charset=utf-8',
  'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
}
