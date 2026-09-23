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

/** The branded 1200×630 social card: calm white, one orange accent. */
export async function renderOgCard(card: OgCard): Promise<ImageResponse> {
  const [semibold, regular] = await fonts
  const tokens = resolveTokens(card.theme).light
  const title = truncate(card.title, 90)
  const titleSize = title.length > 60 ? 56 : title.length > 36 ? 64 : 72

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: tokens.bg,
          padding: '64px 72px',
          fontFamily: 'Poppins',
          borderTop: `14px solid ${tokens.accent}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: tokens.accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="46" height="46" viewBox="0 0 32 32">
              <path d="M9.5 16.5l4.2 4.2L22.5 11.8" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ fontSize: 30, fontWeight: 600, color: tokens.text }}>{card.siteName}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ fontSize: 28, fontWeight: 600, color: tokens['accent-ink'], textTransform: 'uppercase', letterSpacing: 2 }}>
            {truncate(card.eyebrow, 60)}
          </div>
          <div style={{ fontSize: titleSize, fontWeight: 600, color: tokens.text, lineHeight: 1.15, letterSpacing: -1 }}>
            {title}
          </div>
          {card.subtitle ? (
            <div style={{ fontSize: 30, fontWeight: 400, color: tokens['text-muted'], lineHeight: 1.4 }}>
              {truncate(card.subtitle, 110)}
            </div>
          ) : null}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 24, color: tokens['text-muted'] }}>
          <div>{card.host}</div>
          <div style={{ color: tokens['accent-ink'] }}>IITM BS Qualifier</div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: 'Poppins', data: semibold, weight: 600, style: 'normal' },
        { name: 'Poppins', data: regular, weight: 400, style: 'normal' },
      ],
      headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400' },
    },
  )
}
