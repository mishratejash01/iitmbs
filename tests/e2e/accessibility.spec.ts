import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

import { consentCookie, samplePages } from './helpers'

test.describe('accessibility', () => {
  test('sampled pages have no WCAG 2.2 AA violations @mobile', async ({
    page,
    request,
    baseURL,
  }) => {
    await page.context().addCookies([consentCookie(baseURL!)])
    for (const path of [...(await samplePages(request)), '/login', '/search?q=maths']) {
      await page.goto(path)
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze()
      const summary = results.violations.map(
        (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`,
      )
      expect(summary, path).toEqual([])
    }
  })
})
