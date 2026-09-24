import 'server-only'

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { ImageResponse } from 'next/og'

import { truncate } from '@/lib/mdx/plain'
import { resolveTokens, type ThemeOverrides } from '@/lib/theme/tokens'

export const OG_SIZE = { width: 1200, height: 630 } as const

// Read once per server instance; bundled with the deployment.
const fonts = Promise.all([
  readFile(join(process.cwd(), 'src/assets/fonts/Poppins-SemiBold.ttf')),
  readFile(join(process.cwd(), 'src/assets/fonts/Poppins-Regular.ttf')),
])

export type OgCard = {
  eyebrow: string
  title: string
  subtitle?: string | null
  siteName: string
  host: string
  theme?: ThemeOverrides
}

/** The branded 1200×630 social card: the brand teal band, peach and white. */
export async function renderOgCard(card: OgCard): Promise<ImageResponse> {
  const [semibold, regular] = await fonts
  const tokens = resolveTokens(card.theme).light
  const teal = tokens['accent-strong']
  const peach = tokens['accent-soft']
  const title = truncate(card.title, 90)
  const titleSize = title.length > 60 ? 56 : title.length > 36 ? 64 : 72

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: teal,
        padding: '64px 72px',
        fontFamily: 'Poppins',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: peach,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="46" height="46" viewBox="0 0 32 32">
            <circle cx="15.2" cy="15.2" r="7.4" fill="none" stroke={teal} strokeWidth="3.2" />
            <path d="M19.6 19.6l5 5" stroke={teal} strokeWidth="3.2" strokeLinecap="round" />
          </svg>
        </div>
        <div style={{ fontSize: 30, fontWeight: 600, color: tokens['on-accent'] }}>
          {card.siteName}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div
          style={{
            fontSize: 28,
            fontWeight: 600,
            color: peach,
            textTransform: 'uppercase',
            letterSpacing: 2,
          }}
        >
          {truncate(card.eyebrow, 60)}
        </div>
        <div
          style={{
            fontSize: titleSize,
            fontWeight: 600,
            color: tokens['on-accent'],
            lineHeight: 1.15,
            letterSpacing: -1,
          }}
        >
          {title}
        </div>
        {card.subtitle ? (
          <div style={{ fontSize: 30, fontWeight: 400, color: peach, lineHeight: 1.4 }}>
            {truncate(card.subtitle, 110)}
          </div>
        ) : null}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 24,
          color: peach,
        }}
      >
        <div>{card.host}</div>
        <div>IITM BS Qualifier</div>
      </div>
    </div>,
    {
      ...OG_SIZE,
      fonts: [
        { name: 'Poppins', data: semibold, weight: 600, style: 'normal' },
        { name: 'Poppins', data: regular, weight: 400, style: 'normal' },
      ],
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
      },
    },
  )
}
