import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

import type { SiteSettings } from '@/lib/settings/schema'
import { cn } from '@/lib/utils/cn'

const tones = {
  info: 'bg-accent-soft text-accent-ink',
  warning: 'bg-warning-soft text-warning',
  success: 'bg-success-soft text-success',
}

export function AnnouncementBar({ announcement }: { announcement: SiteSettings['announcement'] }) {
  if (!announcement.enabled || !announcement.text) return null
  const content = (
    <>
      <span>{announcement.text}</span>
      {announcement.href ? <ArrowRight aria-hidden="true" className="size-4 shrink-0" /> : null}
    </>
  )
  return (
    <div className={cn('text-small', tones[announcement.tone])} data-print="hide">
      <div className="container-page flex min-h-10 items-center justify-center py-2 text-center">
        {announcement.href ? (
          <Link
            href={announcement.href}
            className="inline-flex items-center gap-1.5 font-medium hover:underline"
            data-track="nav_click"
            data-track-label="announcement"
          >
            {content}
          </Link>
        ) : (
          <p className="inline-flex items-center gap-1.5 font-medium">{content}</p>
        )}
      </div>
    </div>
  )
}
