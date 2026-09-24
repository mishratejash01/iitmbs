import { ImageResponse } from 'next/og'

import { resolveTokens } from '@/lib/theme/tokens'

const SIZES = { '192': 192, '512': 512, 'maskable-512': 512, 'apple-180': 180 } as const

export function generateStaticParams() {
  return Object.keys(SIZES).map((size) => ({ size }))
}

/** PNG app icons for the web manifest and iOS: the "Q" monogram on the brand teal. */
export async function GET(_request: Request, { params }: RouteContext<'/pwa-icon/[size]'>) {
  const { size: key } = await params
  const size = SIZES[key as keyof typeof SIZES]
  if (!size) return new Response('Not found', { status: 404 })

  const accent = resolveTokens().light['accent-strong']
  const maskable = key === 'maskable-512'
  // Maskable icons keep the mark inside the central 80% safe zone.
  const inner = maskable ? size * 0.62 : size
  const radius = maskable ? 0 : size * 0.28

  return new ImageResponse(
    <div
      style={{
        width: size,
        height: size,
        background: accent,
        borderRadius: radius,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg width={inner} height={inner} viewBox="0 0 32 32">
        <circle cx="15.2" cy="15.2" r="7.4" fill="none" stroke="#fff" strokeWidth="3.2" />
        <path d="M19.6 19.6l5 5" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" />
      </svg>
    </div>,
    {
      width: size,
      height: size,
      headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
    },
  )
}
