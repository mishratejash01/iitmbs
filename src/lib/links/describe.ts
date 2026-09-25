export type LinkTarget =
  | { kind: 'youtube'; id: string }
  | { kind: 'internal'; path: string }
  | { kind: 'external'; url: string; host: string; official: boolean }

const YOUTUBE = /^(?:www\.|m\.)?(?:youtube\.com|youtube-nocookie\.com|youtu\.be)$/

/**
 * What a link points to, for previews: a YouTube video, a page on this site
 * (relative, or absolute on `siteUrl`), or another site. IIT Madras hosts
 * (iitm.ac.in and its subdomains) count as official.
 */
export function describeLink(href: string, siteUrl?: string): LinkTarget | null {
  if (href.startsWith('/') && !href.startsWith('//')) return { kind: 'internal', path: href }

  let url: URL
  try {
    url = new URL(href)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null

  const host = url.hostname.toLowerCase()
  if (siteUrl && host === new URL(siteUrl).hostname.toLowerCase()) {
    return { kind: 'internal', path: `${url.pathname}${url.hash}` }
  }
  if (YOUTUBE.test(host)) {
    const id = host.endsWith('youtu.be')
      ? url.pathname.slice(1)
      : (url.searchParams.get('v') ?? url.pathname.match(/^\/(?:embed|shorts)\/([\w-]+)/)?.[1])
    if (id && /^[\w-]{11}$/.test(id)) return { kind: 'youtube', id }
  }
  const bare = host.replace(/^www\./, '')
  return {
    kind: 'external',
    url: url.href,
    host: bare,
    official: bare === 'iitm.ac.in' || bare.endsWith('.iitm.ac.in'),
  }
}
