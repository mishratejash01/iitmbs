import { expect, test } from '@playwright/test'

import { sitemapPaths } from './helpers'

/**
 * Worked solutions must not reach the browser before their release time. The
 * database enforces this (see supabase/tests/security.test.sql); here we check
 * the rendered pages: a locked assignment shows the gate and no solution
 * blocks, and its HTML/RSC payload carries no answer data.
 */
test('locked assignments never ship answers', async ({ request }) => {
  const assignments = ((await sitemapPaths(request)).assignments ?? []).filter((path) =>
    path.includes('/graded-assignment'),
  )
  test.skip(assignments.length === 0, 'no live graded assignments to check yet')

  let locked = 0
  for (const path of assignments.slice(0, 20)) {
    const html = await (await request.get(path)).text()
    if (!html.includes('data-solution-gate')) continue
    locked += 1
    expect(html, `${path}: solution blocks`).not.toContain('data-track="solution_view"')
    expect(html, `${path}: answer data`).not.toMatch(/\\"answerMdx\\":\\"|"answerMdx":"/)
    expect(html, `${path}: answer keys`).not.toMatch(/\\"answerKey\\":\{|"answerKey":\{/)
  }
  test.info().annotations.push({ type: 'checked', description: `${locked} locked assignment(s)` })
})
