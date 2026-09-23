/*
 * Offline support. Deliberately small and conservative:
 *
 * - Pages: network first. Public study pages a student opens are kept (the
 *   newest 40) so recently read notes and walkthroughs work offline; if a
 *   page is not saved, the /offline page is shown instead.
 * - Build assets (/_next/static): cache first — their file names change on
 *   every deploy, so a cached copy is never stale. The newest 200 are kept.
 * - Not cached: images from Cloudinary (cross-origin responses are opaque and
 *   browsers charge them heavily against storage quota), APIs, the admin,
 *   personal pages, sign-in, non-GET requests, anything private or no-store.
 *
 * Bump VERSION to drop every cache on the next visit.
 */

const VERSION = 'v1'
const PAGES = `qh-pages-${VERSION}`
const ASSETS = `qh-assets-${VERSION}`
const OFFLINE_URL = '/offline'
const MAX_PAGES = 40
const MAX_ASSETS = 200
const NETWORK_TIMEOUT_MS = 4000

const PRIVATE_PATHS =
  /^\/(?:api|admin|dashboard|auth|login|onboarding|search|_next\/data|sw\.js)(?:\/|$)/

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(PAGES)
      .then((cache) => cache.add(new Request(OFFLINE_URL, { cache: 'reload' })))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('qh-') && ![PAGES, ASSETS].includes(key))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

function cacheable(response) {
  if (!response || response.status !== 200 || response.type === 'opaqueredirect') return false
  const control = response.headers.get('Cache-Control') || ''
  return !/private|no-store/i.test(control)
}

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  // Oldest entries first (insertion order).
  await Promise.all(keys.slice(0, Math.max(0, keys.length - max)).map((key) => cache.delete(key)))
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      },
    )
  })
}

async function handlePage(event, url) {
  const cache = await caches.open(PAGES)
  // Query strings (tracking, filters) do not change the saved copy.
  const key = url.origin + url.pathname
  const network = fetch(event.request).then(async (response) => {
    if (cacheable(response) && url.pathname !== OFFLINE_URL) {
      // Delete first so the entry moves to the newest position.
      await cache.delete(key)
      await cache.put(key, response.clone())
      await trim(PAGES, MAX_PAGES + 1)
    }
    return response
  })
  // Finish saving even if the saved copy was served first.
  event.waitUntil(network.catch(() => undefined))

  try {
    return await withTimeout(network, NETWORK_TIMEOUT_MS)
  } catch {
    const saved = await cache.match(key)
    if (saved) return saved
    try {
      // Slow rather than offline: keep waiting for the same request.
      return await network
    } catch {
      return (await cache.match(OFFLINE_URL)) || Response.error()
    }
  }
}

async function handleAsset(request) {
  const cache = await caches.open(ASSETS)
  const saved = await cache.match(request)
  if (saved) return saved
  const response = await fetch(request)
  if (response.ok) cache.put(request, response.clone()).then(() => trim(ASSETS, MAX_ASSETS))
  return response
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)

  if (url.origin !== self.location.origin || PRIVATE_PATHS.test(url.pathname)) return

  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(handleAsset(request))
    return
  }
  // Only full page loads; client-side navigations fetch RSC data, which the
  // browser handles (and which falls back to a full load when offline).
  if (request.mode === 'navigate') {
    event.respondWith(handlePage(event, url))
  }
})
