import { expect, test } from '@playwright/test'

import { sitemapPaths } from './helpers'

// `next start` repeats the Location header on page redirects (Vercel sends one);
// Playwright joins repeats with ", ", so read the first value.
const location = (headers: Record<string, string>) => headers.location?.split(',')[0]?.trim() ?? ''

test.describe('status codes and redirects', () => {
  test('unknown pages are real 404s and are not indexed', async ({ request }) => {
    for (const path of [
      '/this-page-does-not-exist',
      '/data-science/not-a-course',
      '/data-science/week-99',
    ]) {
      const response = await request.get(path, { maxRedirects: 0 })
      expect(response.status(), path).toBe(404)
      expect(await response.text()).toMatch(/<meta name="robots" content="[^"]*noindex/)
    }
  })

  test('upper-case URLs redirect permanently to lower case', async ({ request }) => {
    const [course] = (await sitemapPaths(request)).courses ?? []
    test.skip(!course, 'no live course')
    const response = await request.get(course!.toUpperCase(), { maxRedirects: 0 })
    expect(response.status()).toBe(308)
    expect(new URL(location(response.headers()), 'http://x').pathname).toBe(course)
  })

  test('course slugs without hyphens redirect to the canonical slug', async ({ request }) => {
    const course = ((await sitemapPaths(request)).courses ?? []).find((path) => /-\d+$/.test(path))
    test.skip(!course, 'no course slug with a number')
    const response = await request.get(course!.replace(/-(\d+)$/, '$1'), { maxRedirects: 0 })
    expect(response.status()).toBe(308)
    expect(new URL(location(response.headers()), 'http://x').pathname).toBe(course)
  })

  test('signed-in areas send visitors to the login page', async ({ request }) => {
    for (const path of ['/dashboard', '/dashboard/bookmarks', '/admin', '/admin/settings']) {
      const response = await request.get(path, { maxRedirects: 0 })
      expect(response.status(), path).toBe(307)
      expect(location(response.headers())).toContain(`/login?next=${encodeURIComponent(path)}`)
    }
  })

  test('admin and personal APIs refuse anonymous callers', async ({ request }) => {
    expect((await request.get('/api/admin/analytics/export')).status()).toBe(404)
    expect((await request.post('/api/admin/cloudinary-sign', { data: {} })).status()).toBe(403)
    expect((await request.get('/api/me/export', { maxRedirects: 0 })).status()).toBe(401)
  })
})
