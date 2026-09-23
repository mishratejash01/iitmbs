import { expect, test } from '@playwright/test'

import { consentCookie } from './helpers'

type Payload = { consent: string; events: Array<{ name: string; path: string }> }

test.describe('analytics and consent', () => {
  test('a first visit asks for consent and still records an essential page view', async ({
    page,
  }) => {
    const sent: Payload[] = []
    page.on('request', (request) => {
      if (request.url().endsWith('/api/track') && request.method() === 'POST') {
        sent.push(JSON.parse(request.postData() ?? '{}') as Payload)
      }
    })
    await page.goto('/')
    const banner = page.getByRole('region', { name: 'Analytics choices' })
    await expect(banner).toBeVisible()

    await expect
      .poll(() => sent.flatMap((p) => p.events).some((e) => e.name === 'page_view'))
      .toBe(true)
    expect(sent.every((payload) => payload.consent === 'essential')).toBe(true)

    await banner.getByRole('button', { name: 'Essential only' }).click()
    await expect(banner).toBeHidden()
    const cookie = (await page.context().cookies()).find((c) => c.name === 'qh_consent')
    expect(cookie?.value).toBe('essential')
    await page.reload()
    await expect(banner).toBeHidden()
  })

  test('Global Privacy Control limits the choice to essential analytics', async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({ extraHTTPHeaders: { 'Sec-GPC': '1' } })
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'globalPrivacyControl', { value: true })
    })
    const page = await context.newPage()
    await page.goto(baseURL!)
    await expect(page.getByText('Your browser sends Global Privacy Control')).toBeVisible()
    await context.close()
  })

  test('link clicks are tracked without blocking navigation', async ({ page, baseURL }) => {
    await page.context().addCookies([consentCookie(baseURL!)])
    const names: string[] = []
    page.on('request', (request) => {
      if (request.url().endsWith('/api/track')) {
        const payload = JSON.parse(request.postData() ?? '{}') as Payload
        names.push(...payload.events.map((e) => e.name))
      }
    })
    await page.goto('/')
    const link = page.locator('main a[href^="/"]:visible').first()
    const href = await link.getAttribute('href')
    await link.click()
    await page.waitForURL(`**${href}`)
    await expect
      .poll(() => names.includes('nav_click') || names.includes('internal_link_click'))
      .toBe(true)
  })
})
