import type { APIRequestContext, Page } from '@playwright/test'

/** Paths from the sitemap index, grouped by section (programs, courses, …). */
export async function sitemapPaths(request: APIRequestContext): Promise<Record<string, string[]>> {
  const index = await (await request.get('/sitemap.xml')).text()
  const children = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]!).pathname)
  const sections: Record<string, string[]> = {}
  for (const child of children) {
    const name = child
      .split('/')
      .pop()!
      .replace(/\.xml$/, '')
    const xml = await (await request.get(child)).text()
    sections[name] = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]!).pathname)
  }
  return sections
}

/** One representative page per sitemap section, plus the home page. */
export async function samplePages(request: APIRequestContext): Promise<string[]> {
  const sections = await sitemapPaths(request)
  const picks = Object.values(sections).flatMap((paths) => paths.slice(0, 1))
  return [...new Set(['/', ...picks])]
}

/** Collects uncaught errors and console errors for the lifetime of the page. */
export function watchErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(String(error)))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  return errors
}

/** The essential-analytics choice, so the consent banner does not cover content. */
export function consentCookie(baseURL: string) {
  return { name: 'qh_consent', value: 'essential', url: baseURL }
}
