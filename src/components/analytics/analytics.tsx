'use client'

import { useReportWebVitals } from 'next/web-vitals'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

import { currentPage, flush, startPageView, track } from '@/lib/analytics/client'

const SEARCH_ENGINES = /(^|\.)(google\.|bing\.com$|duckduckgo\.com$|yahoo\.|yandex\.|ecosia\.org$)/

function referrerInfo(referrer: string) {
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, '')
    const engine = SEARCH_ENGINES.test(host) ? host.split('.').find((part) => part !== 'search') : undefined
    return { host, engine }
  } catch {
    return { host: undefined, engine: undefined }
  }
}

function readPageContext() {
  const el = document.querySelector<HTMLElement>('[data-page-context]')
  return {
    pageType: el?.dataset.pageType,
    entityId: el?.dataset.entityId,
  }
}

/**
 * Site-wide tracking via a handful of delegated listeners — components opt in
 * with data-track attributes instead of shipping their own JavaScript.
 */
export function Analytics({ heartbeatSeconds = 15 }: { heartbeatSeconds?: number }) {
  const pathname = usePathname()
  const firstView = useRef(true)
  const previousPath = useRef<string | null>(null)
  const engaged = useRef(0)
  const scrollMarks = useRef(new Set<number>())
  const errors = useRef(0)

  useReportWebVitals((metric) => {
    if (!['LCP', 'CLS', 'INP', 'TTFB', 'FCP'].includes(metric.name)) return
    track('web_vital', {
      metric: metric.name,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value) / (metric.name === 'CLS' ? 1000 : 1),
      rating: metric.rating,
    })
  })

  // Page views on every navigation.
  useEffect(() => {
    const isEntry = firstView.current
    const referrer = isEntry ? document.referrer : previousPath.current ? `${location.origin}${previousPath.current}` : ''
    const { host, engine } = isEntry && document.referrer ? referrerInfo(document.referrer) : { host: undefined, engine: undefined }
    const context = readPageContext()
    startPageView({
      path: pathname,
      pageType: context.pageType,
      entityId: context.entityId,
      title: document.title.slice(0, 200),
      referrer: referrer || undefined,
      isEntry,
      referrerHost: host,
      searchEngine: engine,
    })
    if (context.pageType === '404') track('404_hit', { path: pathname, referrer: document.referrer || undefined })
    if (context.pageType === 'formula_sheet') track('formula_sheet_open', { course: pathname.split('/')[2] })
    firstView.current = false
    previousPath.current = pathname
    engaged.current = 0
    scrollMarks.current = new Set()
    errors.current = 0
  }, [pathname])

  // Engaged-time heartbeat while the tab is visible.
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState !== 'visible') return
      engaged.current += heartbeatSeconds
      track('time_on_page', { seconds: engaged.current })
    }, heartbeatSeconds * 1000)
    return () => clearInterval(timer)
  }, [heartbeatSeconds])

  // Scroll-depth milestones, sampled once per animation frame.
  useEffect(() => {
    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const doc = document.documentElement
        const max = doc.scrollHeight - window.innerHeight
        const depth = max <= 0 ? 100 : Math.round((window.scrollY / max) * 100)
        for (const mark of [25, 50, 75, 100]) {
          if (depth >= mark && !scrollMarks.current.has(mark)) {
            scrollMarks.current.add(mark)
            track('scroll_depth', { depth: mark })
          }
        }
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])

  // Delegated clicks, disclosure toggles, copies, errors and page hide.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null
      const tracked = target?.closest<HTMLElement>('[data-track]')
      if (tracked && tracked.tagName !== 'DETAILS') {
        const props: Record<string, string> = {}
        for (const [key, value] of Object.entries(tracked.dataset)) {
          if (key.startsWith('track') && key !== 'track' && value) {
            props[key.slice(5, 6).toLowerCase() + key.slice(6)] = value.slice(0, 200)
          }
        }
        const href = tracked.getAttribute('href')
        if (href) props.href = href.slice(0, 300)
        track(tracked.dataset.track as Parameters<typeof track>[0], props)
        return
      }
      const link = target?.closest<HTMLAnchorElement>('a[href]')
      if (!link) return
      const url = new URL(link.href, location.href)
      if (url.origin === location.origin) {
        if (url.pathname !== location.pathname) {
          const area = link.closest<HTMLElement>('[data-track-area]')?.dataset.trackArea ?? 'content'
          track('internal_link_click', { href: url.pathname, label: link.textContent?.trim().slice(0, 80), area })
        }
      } else if (/^https?:$/.test(url.protocol)) {
        track('outbound_link_click', { href: url.href.slice(0, 300), host: url.hostname }, { immediate: true })
      }
    }

    const onToggle = (event: Event) => {
      const details = event.target as HTMLDetailsElement
      if (details.open && details.dataset.track) {
        track(details.dataset.track as Parameters<typeof track>[0], {
          question_id: details.dataset.trackQuestionId,
          position: details.dataset.trackPosition ? Number(details.dataset.trackPosition) : undefined,
        })
      }
    }

    const onCopy = () => {
      const length = document.getSelection()?.toString().length ?? 0
      if (length > 0) track('copy_text', { length })
    }

    const onError = (event: ErrorEvent) => {
      if (errors.current++ >= 5) return
      track('js_error', { message: event.message?.slice(0, 200), source: event.filename?.slice(0, 200), line: event.lineno })
    }
    const onRejection = (event: PromiseRejectionEvent) => {
      if (errors.current++ >= 5) return
      track('js_error', { message: String(event.reason).slice(0, 200), source: 'unhandledrejection' })
    }

    const onVisibility = () => {
      track('tab_visibility_change', { state: document.visibilityState })
      if (document.visibilityState === 'hidden') {
        if (engaged.current > 0) track('time_on_page', { seconds: engaged.current })
        flush(true)
      }
    }
    const onPageHide = () => {
      if (currentPage()) track('session_end')
      flush(true)
    }

    document.addEventListener('click', onClick, { capture: true })
    document.addEventListener('toggle', onToggle, { capture: true })
    document.addEventListener('copy', onCopy)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)
    window.addEventListener('pagehide', onPageHide)
    return () => {
      document.removeEventListener('click', onClick, { capture: true })
      document.removeEventListener('toggle', onToggle, { capture: true })
      document.removeEventListener('copy', onCopy)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
      window.removeEventListener('pagehide', onPageHide)
    }
  }, [])

  return null
}
