'use client'

import { Monitor, Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

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
}

/** Cycles system → light → dark. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system')

  useEffect(() => setTheme(readTheme()), [])

  const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length] ?? 'system'
  const Icon = ICONS[theme]

  return (
    <button
      type="button"
      onClick={() => {
        applyTheme(next)
        setTheme(next)
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
