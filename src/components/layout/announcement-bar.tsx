import Link from 'next/link'

import type { SiteSettings } from '@/lib/settings/schema'
import { cn } from '@/lib/utils/cn'

const tones = {
  info: 'bg-accent-strong text-on-accent',
  warning: 'bg-warning-soft text-warning',
  success: 'bg-success-soft text-success',
}

export function AnnouncementBar({ announcement }: { announcement: SiteSettings['announcement'] }) {
  if (!announcement.enabled || !announcement.text) return null
  return (
    <div className={cn('text-small', tones[announcement.tone])} data-print="hide">
      <div className="container-page flex min-h-10 items-center justify-center py-2 text-center">
        {announcement.href ? (
          <Link
            href={announcement.href}
            className="font-medium underline decoration-current/40 underline-offset-4 hover:decoration-current"
            data-track="nav_click"
            data-track-label="announcement"
          >
            {announcement.text}
          </Link>
        ) : (
          <p className="font-medium">{announcement.text}</p>
        )}
      </div>
    </div>
  )
}
