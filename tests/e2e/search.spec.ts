import { expect, test } from '@playwright/test'

import { consentCookie, sitemapPaths } from './helpers'

test.describe('search', () => {
  test('Ctrl+K opens search and a course + week query jumps straight to the week', async ({
    page,
    request,
    baseURL,
  }) => {
    // Week hubs without content are not in the sitemap, so start from a course.
    const course = ((await sitemapPaths(request)).courses ?? [])[0]
    test.skip(!course, 'no live course')
    const hub = `${course}/week-1`
    test.skip((await request.get(hub)).status() !== 200, 'course has no week 1 hub')
    await page.context().addCookies([consentCookie(baseURL!)])
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.keyboard.press('Control+k')
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // "<course alias> week <n>", built from the hub path: /program/course/week-n
    const [, , courseSlug, weekSegment] = hub.split('/')
    const query = `${courseSlug!.replace(/-/g, ' ')} ${weekSegment!.replace('-', ' ')}`
    await dialog.getByRole('combobox').fill(query)
    const first = dialog.getByRole('option').first()
    await expect(first).toContainText('Go to')
    await page.keyboard.press('Enter')
    await page.waitForURL(`**${hub}`)
  })

  test('the search page works without JavaScript', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto(`${baseURL}/search?q=eligibility`)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('status')).toContainText('eligibility')
    await context.close()
  })
})
