'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, type ReactNode } from 'react'

import { cn } from '@/lib/utils/cn'

/**
 * A <details>-based menu that works without JavaScript and, once hydrated,
 * closes on navigation, on Escape and when clicking outside it.
 */
export function Disclosure({
  summary,
  summaryClassName,
  panelClassName,
  className,
  label,
  children,
}: {
  summary: ReactNode
  summaryClassName?: string
  panelClassName?: string
  className?: string
  label: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDetailsElement>(null)
  const pathname = usePathname()

  useEffect(() => {
    if (ref.current) ref.current.open = false
  }, [pathname])

  useEffect(() => {
    const details = ref.current
    if (!details) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && details.open) {
        details.open = false
        details.querySelector('summary')?.focus()
      }
    }
    const onClick = (event: MouseEvent) => {
      if (details.open && !details.contains(event.target as Node)) details.open = false
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('click', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('click', onClick)
    }
  }, [])

  return (
    <details ref={ref} className={cn('group relative', className)}>
      <summary
        aria-label={label}
        className={cn('list-none [&::-webkit-details-marker]:hidden', summaryClassName)}
      >
        {summary}
      </summary>
      <div className={panelClassName}>{children}</div>
    </details>
  )
}
