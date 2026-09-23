'use client'

import { useSyncExternalStore } from 'react'

import { readCookie } from '@/lib/analytics/client'

/**
 * Browser-only values read without "setState in an effect". The server
 * snapshot is what static HTML shows; React swaps in the browser value right
 * after hydration, with no mismatch warning and no extra effect pass.
 */

const never = () => () => {}

/** A cookie's current value (null on the server). Re-read on every render. */
export function useCookie(name: string): string | null {
  return useSyncExternalStore(
    never,
    () => readCookie(name),
    () => null,
  )
}

type Clock = { subscribe: (notify: () => void) => () => void; get: () => number }
const clocks = new Map<number, Clock>()

/** One shared clock per interval; it ticks only while something listens. */
function clockFor(intervalMs: number): Clock {
  const existing = clocks.get(intervalMs)
  if (existing) return existing
  let now = Date.now()
  let timer: ReturnType<typeof setInterval> | undefined
  const listeners = new Set<() => void>()
  const tick = () => {
    now = Date.now()
    listeners.forEach((listener) => listener())
  }
  const clock: Clock = {
    subscribe(notify) {
      listeners.add(notify)
      if (listeners.size === 1) {
        // The clock may be stale after a quiet period: refresh on first use.
        queueMicrotask(tick)
        timer = setInterval(tick, intervalMs)
      }
      return () => {
        listeners.delete(notify)
        if (listeners.size === 0) clearInterval(timer)
      }
    },
    get: () => now,
  }
  clocks.set(intervalMs, clock)
  return clock
}

/**
 * The current time, ticking every `intervalMs` while anything is subscribed.
 * Null on the server and during hydration, so countdowns render after it.
 */
export function useNow(intervalMs = 60_000): number | null {
  const clock = clockFor(intervalMs)
  return useSyncExternalStore(clock.subscribe, clock.get, () => null)
}
