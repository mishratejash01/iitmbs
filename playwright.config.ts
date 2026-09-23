import { defineConfig, devices } from '@playwright/test'

/**
 * End-to-end tests run against a production build (`npm run build` first).
 * Set PLAYWRIGHT_BASE_URL to test a deployed site instead of a local server.
 */
const external = process.env.PLAYWRIGHT_BASE_URL

// The site's analytics treat this token as a bot, so test runs never count as visits.
const tagged = (userAgent: string) => `${userAgent} Playwright`
const baseURL = external ?? 'http://localhost:3000'

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL, trace: 'on-first-retry' },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], userAgent: tagged(devices['Desktop Chrome'].userAgent) },
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'], userAgent: tagged(devices['Pixel 7'].userAgent) },
      grep: /@mobile/,
    },
  ],
  webServer: external
    ? undefined
    : {
        command: 'npm run start',
        url: `${baseURL}/robots.txt`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
})
