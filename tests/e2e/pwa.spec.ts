import { expect, test } from '@playwright/test'

import { consentCookie, samplePages } from './helpers'

test('recently read pages open offline; others show the offline page', async ({
  browser,
  request,
  baseURL,
}) => {
  const [, first, second] = await samplePages(request)
  test.skip(!first || !second, 'needs two live pages')
  const context = await browser.newContext()
  await context.addCookies([consentCookie(baseURL!)])
  const page = await context.newPage()

  await page.goto(`${baseURL}/`)
  const registered = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return false
    await navigator.serviceWorker.ready
    return true
  })
  test.skip(!registered, 'service worker not available')
  await page.reload()
  await page.goto(`${baseURL}${first}`)
  const title = await page.locator('h1').innerText()

  await context.setOffline(true)
  await page.goto(`${baseURL}${first}`)
  await expect(page.locator('h1')).toHaveText(title)
  await page.goto(`${baseURL}${second}`)
  await expect(page.locator('h1')).toHaveText(/offline/i)
  await context.close()
})
