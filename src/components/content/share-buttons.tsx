import { metaRowClasses } from '@/components/ui/badge'
import { env } from '@/env'
import { absoluteUrl } from '@/lib/routes'

import { CopyLinkButton } from './copy-link-button'

/** WhatsApp and Telegram first: that is where qualifier students share. */
export function ShareButtons({ path, title }: { path: string; title: string }) {
  const url = absoluteUrl(env.siteUrl, path)
  const text = `${title} — ${url}`
  const links = [
    {
      channel: 'whatsapp',
      label: 'WhatsApp',
      href: `https://wa.me/?text=${encodeURIComponent(text)}`,
    },
    {
      channel: 'telegram',
      label: 'Telegram',
      href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    },
  ]
  return (
    <div className="flex flex-wrap items-center gap-x-3 text-small" data-print="hide">
      <span className="text-muted">Share with your study group:</span>
      {/* Each item is wrapped so the separator dot sits outside the underlined link. */}
      <div className={metaRowClasses}>
        {links.map((link) => (
          <span key={link.channel}>
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center font-semibold text-accent-ink underline decoration-accent-ink/30 underline-offset-4 hover:decoration-accent-ink"
              data-track="share_click"
              data-track-channel={link.channel}
            >
              {link.label}
            </a>
          </span>
        ))}
        <span>
          <CopyLinkButton url={url} title={title} />
        </span>
      </div>
    </div>
  )
}
