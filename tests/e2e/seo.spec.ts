import { expect, test } from '@playwright/test'

import { consentCookie, samplePages, sitemapPaths, watchErrors } from './helpers'

test.describe('search-engine essentials', () => {
  test('every sampled page has one H1, a self canonical, a description and valid JSON-LD', async ({
    page,
    request,
    baseURL,
  }) => {
    await page.context().addCookies([consentCookie(baseURL!)])
    const errors = watchErrors(page)

    for (const path of await samplePages(request)) {
      const response = await page.goto(path)
      expect(response?.status(), path).toBe(200)

      await expect(page.locator('h1'), `${path}: exactly one h1`).toHaveCount(1)
      await expect(page.locator('html')).toHaveAttribute('lang', 'en')

      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href')
      expect(canonical, `${path}: canonical`).toBeTruthy()
      expect(
        new URL(canonical!).pathname.replace(/\/$/, '') || '/',
        `${path}: self canonical`,
      ).toBe(path)

      const description = await page.locator('meta[name="description"]').getAttribute('content')
      expect(description?.length ?? 0, `${path}: meta description`).toBeGreaterThan(50)
      await expect(page.locator('meta[property="og:image"]')).toHaveCount(1)

      const blocks = await page.locator('script[type="application/ld+json"]').allTextContents()
      expect(blocks.length, `${path}: JSON-LD present`).toBeGreaterThan(0)
      for (const block of blocks) {
        const data = JSON.parse(block) as Record<string, unknown>
        expect(data['@context'], `${path}: JSON-LD context`).toBe('https://schema.org')
      }
    }
    expect(errors).toEqual([])
  })

  test('robots.txt points at the sitemap and keeps private areas out', async ({ request }) => {
    const robots = await (await request.get('/robots.txt')).text()
    expect(robots).toMatch(/Sitemap: .+\/sitemap\.xml/)
    for (const path of ['/admin', '/dashboard', '/api/'])
      expect(robots).toContain(`Disallow: ${path}`)
  })

  test('the sitemap lists only live, indexable pages', async ({ request }) => {
    const sections = await sitemapPaths(request)
    const paths = Object.values(sections).flat()
    expect(paths.length).toBeGreaterThan(0)
    // Check a spread of URLs from every section.
    const sample = Object.values(sections).flatMap((list) => list.slice(0, 5))
    for (const path of sample) {
      const response = await request.get(path, { maxRedirects: 0 })
      expect(response.status(), path).toBe(200)
      const html = await response.text()
      expect(html, `${path} must not be noindex`).not.toMatch(
        /<meta name="robots" content="[^"]*noindex/,
      )
    }
  })

  test('Open Graph images render as PNG', async ({ request }) => {
    const response = await request.get('/og')
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('image/png')
  })
})
