'use client'

export const OPEN_CONSENT_EVENT = 'qh:open-consent'

/** Re-opens the analytics choice banner (footer link). */
export function ConsentSettingsButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))}
    >
      Cookie settings
    </button>
  )
}
