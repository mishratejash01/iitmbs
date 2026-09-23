'use client'

import { Printer } from 'lucide-react'

import { track } from '@/lib/analytics/client'

/** Prints the page with the print stylesheet (navigation and widgets hidden). */
export function PrintButton({ pageType }: { pageType: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        track('print_click', { page_type: pageType })
        window.print()
      }}
      className="inline-flex min-h-11 items-center gap-2 rounded-control border border-border px-3 text-small font-medium text-text hover:border-accent"
      data-print="hide"
    >
      <Printer aria-hidden="true" className="size-4" />
      Print
    </button>
  )
}
