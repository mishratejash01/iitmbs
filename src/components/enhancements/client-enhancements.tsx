'use client'

import { useEffect } from 'react'

/**
 * Small progressive enhancements wired once for the whole site via event
 * delegation: code-block copy buttons.
 */
export function ClientEnhancements() {
  useEffect(() => {
    const onClick = async (event: MouseEvent) => {
      const button = (event.target as Element | null)?.closest<HTMLButtonElement>('[data-copy-code]')
      if (!button) return
      const code = button.parentElement?.querySelector('pre')?.innerText ?? ''
      try {
        await navigator.clipboard.writeText(code)
        const previous = button.textContent
        button.textContent = 'Copied'
        setTimeout(() => {
          button.textContent = previous
        }, 1500)
      } catch {
        button.textContent = 'Press Ctrl+C'
      }
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  return null
}
