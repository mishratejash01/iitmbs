import type { NextConfig } from 'next'

const isDev = process.env.NODE_ENV !== 'production'

function originOf(value: string | undefined): string | null {
  if (!value) return null
  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

const supabaseOrigin = originOf(process.env.NEXT_PUBLIC_SUPABASE_URL)

/**
 * Static Content-Security-Policy. Pages are statically prerendered, so a
 * per-request nonce is not possible; inline scripts are therefore allowed, but
 * every external origin is pinned to the services the app actually uses.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://res.cloudinary.com https://lh3.googleusercontent.com https://i.ytimg.com",
  "font-src 'self' data:",
  [
    "connect-src 'self'",
    supabaseOrigin,
    supabaseOrigin?.replace(/^http/, 'ws'),
    'https://api.cloudinary.com',
  ]
    .filter(Boolean)
    .join(' '),
  "media-src 'self' https://res.cloudinary.com",
  "frame-src 'self' https://www.youtube-nocookie.com",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
]

const nextConfig: NextConfig = {
  cacheComponents: true,
  reactStrictMode: true,
  // The repository lives inside a larger folder with its own lockfile.
  turbopack: { root: process.cwd() },
  poweredByHeader: false,
  trailingSlash: false,

  cacheLife: {
    // Published study content. On-demand revalidation (admin publish, database
    // webhook) handles real edits; this is only the safety-net interval.
    content: { stale: 300, revalidate: 3600, expire: 60 * 60 * 24 * 30 },
    // Site settings, navigation and footer.
    settings: { stale: 300, revalidate: 600, expire: 60 * 60 * 24 * 7 },
    // Search results for a given query.
    search: { stale: 60, revalidate: 300, expire: 60 * 60 },
  },

  images: {
    loader: 'custom',
    loaderFile: './src/lib/cloudinary/loader.ts',
    deviceSizes: [360, 480, 640, 768, 1024, 1280, 1536],
    imageSizes: [32, 48, 64, 96, 128, 256],
  },

  experimental: {
    optimizePackageImports: ['lucide-react'],
  },

  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ]
  },
}

export default nextConfig
