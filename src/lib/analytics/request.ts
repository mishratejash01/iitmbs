import 'server-only'

import { createHmac } from 'node:crypto'

import { isbot } from 'isbot'

import { env } from '@/env'

/**
 * Request enrichment for analytics, computed on the server so the client
 * cannot spoof it. Only coarse data is kept: device class, browser and OS
 * family, and country/region (city only with detailed consent).
 */

export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'other'

export function parseUserAgent(ua: string): { device: DeviceType; browser: string; os: string } {
  const device: DeviceType = /iPad|Tablet|Nexus (7|9|10)|SM-T|Kindle|Silk/i.test(ua)
    ? 'tablet'
    : /Mobi|Android|iPhone|iPod|Opera Mini|IEMobile/i.test(ua)
      ? 'mobile'
      : ua
        ? 'desktop'
        : 'other'

  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /OPR\/|Opera/.test(ua)
      ? 'Opera'
      : /SamsungBrowser/.test(ua)
        ? 'Samsung Internet'
        : /UCBrowser/.test(ua)
          ? 'UC Browser'
          : /Firefox\//.test(ua)
            ? 'Firefox'
            : /Chrome\/|CriOS/.test(ua)
              ? 'Chrome'
              : /Safari\//.test(ua)
                ? 'Safari'
                : 'Other'

  const os = /Android/.test(ua)
    ? 'Android'
    : /iPhone|iPad|iPod/.test(ua)
      ? 'iOS'
      : /Windows/.test(ua)
        ? 'Windows'
        : /Mac OS X/.test(ua)
          ? 'macOS'
          : /CrOS/.test(ua)
            ? 'ChromeOS'
            : /Linux/.test(ua)
              ? 'Linux'
              : 'Other'

  return { device, browser, os }
}

export function isBotRequest(ua: string | null): boolean {
  if (!ua) return true
  return isbot(ua) || /HeadlessChrome|Lighthouse|PageSpeed|GTmetrix|Pingdom|UptimeRobot/i.test(ua)
}

const SEARCH_ENGINES: Array<[RegExp, string]> = [
  [/(^|\.)google\./, 'google'],
  [/(^|\.)bing\.com$/, 'bing'],
  [/(^|\.)duckduckgo\.com$/, 'duckduckgo'],
  [/(^|\.)yahoo\./, 'yahoo'],
  [/(^|\.)yandex\./, 'yandex'],
  [/(^|\.)ecosia\.org$/, 'ecosia'],
  [/(^|\.)search\.brave\.com$/, 'brave'],
]

const SOCIAL: Array<[RegExp, string]> = [
  [/(^|\.)(whatsapp\.com|wa\.me)$/, 'whatsapp'],
  [/(^|\.)(t\.me|telegram\.org|telegram\.me)$/, 'telegram'],
  [/(^|\.)(youtube\.com|youtu\.be)$/, 'youtube'],
  [/(^|\.)reddit\.com$/, 'reddit'],
  [/(^|\.)instagram\.com$/, 'instagram'],
  [/(^|\.)(facebook\.com|fb\.com)$/, 'facebook'],
  [/(^|\.)linkedin\.com$/, 'linkedin'],
  [/(^|\.)(x\.com|twitter\.com|t\.co)$/, 'x'],
  [/(^|\.)quora\.com$/, 'quora'],
]

export function referrerHost(referrer: string | null | undefined): string | null {
  if (!referrer) return null
  try {
    return new URL(referrer).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return null
  }
}

export function searchEngineFor(host: string | null): string | null {
  if (!host) return null
  return SEARCH_ENGINES.find(([pattern]) => pattern.test(host))?.[1] ?? null
}

/** Classifies where a session came from. */
export function trafficSource(input: {
  referrer: string | null | undefined
  utmSource: string | null | undefined
  userAgent: string
  siteHost: string
}): string {
  if (input.utmSource) return input.utmSource.toLowerCase().slice(0, 50)
  const host = referrerHost(input.referrer)
  if (host) {
    if (host === input.siteHost) return 'internal'
    const engine = searchEngineFor(host)
    if (engine) return engine
    const social = SOCIAL.find(([pattern]) => pattern.test(host))?.[1]
    return social ?? `referral:${host}`.slice(0, 80)
  }
  // In-app browsers often send no referrer but identify themselves.
  if (/WhatsApp/i.test(input.userAgent)) return 'whatsapp'
  if (/Telegram/i.test(input.userAgent)) return 'telegram'
  if (/Instagram/i.test(input.userAgent)) return 'instagram'
  if (/FBAN|FBAV/i.test(input.userAgent)) return 'facebook'
  return 'direct'
}

/** Client IP, used only transiently for hashing and rate limiting. */
export function clientIp(headers: Headers): string | null {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || headers.get('x-real-ip') || null
}

/**
 * One-way, daily-rotating hash of the IP. The raw address is never stored;
 * the same visitor produces a different hash each day.
 */
export function hashIp(ip: string | null): string | null {
  if (!ip || !env.analyticsHashSecret) return null
  const day = new Date().toISOString().slice(0, 10)
  return createHmac('sha256', env.analyticsHashSecret)
    .update(`${day}:${ip}`)
    .digest('hex')
    .slice(0, 32)
}

/** Coarse location from the hosting platform's geo headers. */
export function geoFromHeaders(headers: Headers): {
  country: string | null
  region: string | null
  city: string | null
} {
  const decode = (value: string | null) => {
    if (!value) return null
    try {
      return decodeURIComponent(value).slice(0, 80)
    } catch {
      return value.slice(0, 80)
    }
  }
  return {
    country: decode(headers.get('x-vercel-ip-country')),
    region: decode(headers.get('x-vercel-ip-country-region')),
    city: decode(headers.get('x-vercel-ip-city')),
  }
}
