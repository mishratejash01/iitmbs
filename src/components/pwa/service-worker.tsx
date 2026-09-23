'use client'

import { useEffect } from 'react'

import { isProductionBuild } from '@/env.client'

/** Registers the offline service worker in production browsers that support it. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!isProductionBuild || !('serviceWorker' in navigator)) return
    const register = () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => undefined)
    }
    if (document.readyState === 'complete') register()
    else window.addEventListener('load', register, { once: true })
  }, [])
  return null
}
