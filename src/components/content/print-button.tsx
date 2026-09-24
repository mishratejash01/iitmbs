'use client'

import { buttonClasses } from '@/components/ui/button'
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
      className={buttonClasses('secondary', 'sm')}
      data-print="hide"
    >
      Print
    </button>
  )
}
