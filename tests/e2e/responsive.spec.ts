import { expect, test } from '@playwright/test'

import { consentCookie, samplePages } from './helpers'

test('no page scrolls sideways at 360px', async ({ browser, request, baseURL }) => {
  const context = await browser.newContext({ viewport: { width: 360, height: 780 } })
  await context.addCookies([consentCookie(baseURL!)])
  const page = await context.newPage()
  for (const path of await samplePages(request)) {
    await page.goto(`${baseURL}${path}`)
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow, path).toBeLessThanOrEqual(0)
  }
  await context.close()
})
