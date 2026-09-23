'use client'

import { Monitor, Moon, Sun } from 'lucide-react'
import { useSyncExternalStore } from 'react'

import { track } from '@/lib/analytics/client'

type Theme = 'system' | 'light' | 'dark'
const ORDER: Theme[] = ['system', 'light', 'dark']
const ICONS = { system: Monitor, light: Sun, dark: Moon }

function readTheme(): Theme {
  try {
    const saved = localStorage.getItem('theme')
    return saved === 'light' || saved === 'dark' ? saved : 'system'
  } catch {
    return 'system'
  }
}

const CHANGE_EVENT = 'qh-theme-change'

function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'system') delete root.dataset.theme
  else root.dataset.theme = theme
  try {
    if (theme === 'system') localStorage.removeItem('theme')
    else localStorage.setItem('theme', theme)
  } catch {
    // Storage unavailable (private mode): the choice lasts for this page only.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

// The saved choice is an external store: this tab's toggles and other tabs
// (the storage event) both update every toggle on the page.
function subscribe(notify: () => void) {
  window.addEventListener(CHANGE_EVENT, notify)
  window.addEventListener('storage', notify)
  return () => {
    window.removeEventListener(CHANGE_EVENT, notify)
    window.removeEventListener('storage', notify)
  }
}

// Private mode cannot store the choice, so fall back to what is on <html>.
function currentTheme(): Theme {
  const saved = readTheme()
  if (saved !== 'system') return saved
  const attribute = document.documentElement.dataset.theme
  return attribute === 'light' || attribute === 'dark' ? attribute : 'system'
}

/** Cycles system → light → dark. */
export function ThemeToggle() {
  const theme = useSyncExternalStore<Theme>(subscribe, currentTheme, () => 'system')

  const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length] ?? 'system'
  const Icon = ICONS[theme]

  return (
    <button
      type="button"
      onClick={() => {
        applyTheme(next)
        track('theme_toggle', { theme: next })
      }}
      className="flex size-11 items-center justify-center rounded-control text-muted transition-colors hover:bg-surface hover:text-text"
      aria-label={`Theme: ${theme}. Switch to ${next}.`}
      title={`Theme: ${theme}`}
    >
      <Icon aria-hidden="true" className="size-5" />
    </button>
  )
}
