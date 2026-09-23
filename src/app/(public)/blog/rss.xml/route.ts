import { env } from '@/env'
import { getBlogPostIndex } from '@/lib/data/blog'
import { getPage } from '@/lib/data/pages'
import { getSiteSettings } from '@/lib/data/settings'
import { absoluteUrl, BLOG_PATH } from '@/lib/routes'
import { escapeXml } from '@/lib/seo/sitemap-xml'

const FEED_SIZE = 50

/** RSS 2.0 feed of the newest posts, for feed readers and search engines. */
export async function GET() {
  const [settings, page, posts] = await Promise.all([
    getSiteSettings(),
    getPage('blog'),
    getBlogPostIndex(),
  ])
  const blogUrl = absoluteUrl(env.siteUrl, BLOG_PATH)
  const feedUrl = absoluteUrl(env.siteUrl, `${BLOG_PATH}/rss.xml`)
  const newest = posts.reduce<string | null>(
    (latest, post) => (!latest || post.updatedAt > latest ? post.updatedAt : latest),
    null,
  )

  const items = posts
    .slice(0, FEED_SIZE)
    .map((post) => {
      const url = absoluteUrl(env.siteUrl, post.path)
      return [
        '    <item>',
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${escapeXml(url)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
        `      <category>${escapeXml(post.category.name)}</category>`,
        post.summary ? `      <description>${escapeXml(post.summary)}</description>` : null,
        post.publishedAt
          ? `      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>`
          : null,
        '    </item>',
      ]
        .filter(Boolean)
        .join('\n')
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(page?.title ?? settings.site_name)}</title>
    <link>${escapeXml(blogUrl)}</link>
    <description>${escapeXml(page?.summary ?? settings.description ?? settings.site_name)}</description>
    <language>en-IN</language>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
${newest ? `    <lastBuildDate>${new Date(newest).toUTCString()}</lastBuildDate>\n` : ''}${items}
  </channel>
</rss>
`
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
