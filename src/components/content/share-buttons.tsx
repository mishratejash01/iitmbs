import { env } from '@/env'
import { absoluteUrl } from '@/lib/routes'

import { CopyLinkButton } from './copy-link-button'

/** WhatsApp and Telegram first — that is where qualifier students share. */
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
    <div className="flex flex-wrap items-center gap-2" data-print="hide">
      <span className="text-small text-muted">Share with your study group:</span>
      {links.map((link) => (
        <a
          key={link.channel}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center rounded-control border border-border px-3 text-small font-medium text-text hover:border-accent"
          data-track="share_click"
          data-track-channel={link.channel}
        >
          {link.label}
        </a>
      ))}
      <CopyLinkButton url={url} title={title} />
    </div>
  )
}
