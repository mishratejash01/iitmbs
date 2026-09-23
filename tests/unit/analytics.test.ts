import { describe, expect, it, vi } from 'vitest'

vi.mock('@/env', () => ({ env: { analyticsHashSecret: 'test-secret-value-123' } }))

const { parseUserAgent, referrerHost, trafficSource, hashIp, isBotRequest } = await import('@/lib/analytics/request')
const { trackPayloadSchema } = await import('@/lib/analytics/schema')

describe('request enrichment', () => {
  it('classifies devices, browsers and operating systems', () => {
    expect(
      parseUserAgent('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/128.0 Mobile Safari/537.36'),
    ).toEqual({ device: 'mobile', browser: 'Chrome', os: 'Android' })
    expect(parseUserAgent('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) Version/17.0 Safari/605.1.15')).toMatchObject({
      device: 'tablet',
      os: 'iOS',
    })
  })

  it('detects bots and headless tools', () => {
    expect(isBotRequest('Googlebot/2.1 (+http://www.google.com/bot.html)')).toBe(true)
    expect(isBotRequest('Mozilla/5.0 HeadlessChrome/120')).toBe(true)
    expect(isBotRequest(null)).toBe(true)
  })

  it('classifies traffic sources', () => {
    const base = { utmSource: null, userAgent: 'Mozilla/5.0', siteHost: 'example.com' }
    expect(trafficSource({ ...base, referrer: 'https://www.google.co.in/' })).toBe('google')
    expect(trafficSource({ ...base, referrer: 'https://t.me/somechannel' })).toBe('telegram')
    expect(trafficSource({ ...base, referrer: null, userAgent: 'Mozilla/5.0 WhatsApp/2.23' })).toBe('whatsapp')
    expect(trafficSource({ ...base, referrer: 'https://example.com/a' })).toBe('internal')
    expect(trafficSource({ ...base, referrer: null, utmSource: 'Newsletter' })).toBe('newsletter')
    expect(trafficSource({ ...base, referrer: null })).toBe('direct')
    expect(referrerHost('https://www.bing.com/search?q=x')).toBe('bing.com')
  })

  it('hashes IPs one-way and never returns the raw address', () => {
    const hash = hashIp('203.0.113.7')
    expect(hash).toMatch(/^[0-9a-f]{32}$/)
    expect(hash).not.toContain('203')
    expect(hashIp(null)).toBeNull()
  })
})

describe('track payload schema', () => {
  const valid = {
    anonymous_id: '6f1c2a3b-4d5e-4f60-8a71-b2c3d4e5f601',
    session_id: '7a1c2a3b-4d5e-4f60-9a71-b2c3d4e5f602',
    consent: 'essential',
    events: [{ name: 'page_view', path: '/data-science' }],
  }

  it('accepts a well-formed batch', () => {
    expect(trackPayloadSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects unknown events, bad paths and oversized batches', () => {
    expect(trackPayloadSchema.safeParse({ ...valid, events: [{ name: 'hack', path: '/' }] }).success).toBe(false)
    expect(trackPayloadSchema.safeParse({ ...valid, events: [{ name: 'page_view', path: 'http://x' }] }).success).toBe(false)
    expect(
      trackPayloadSchema.safeParse({ ...valid, events: Array.from({ length: 26 }, () => valid.events[0]) }).success,
    ).toBe(false)
  })
})
