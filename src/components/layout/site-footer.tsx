import Link from 'next/link'

import { ConsentSettingsButton } from '@/components/consent/consent-settings-button'
import { getCopyrightYear } from '@/lib/data/copyright'
import { getFooterGroups } from '@/lib/data/navigation'
import type { SiteSettings } from '@/lib/settings/schema'

import { LogoMark } from './logo'

const SOCIAL_LABELS: Record<string, string> = {
  telegram: 'Telegram',
  whatsapp: 'WhatsApp',
  youtube: 'YouTube',
  instagram: 'Instagram',
  x: 'X',
  github: 'GitHub',
}

export async function SiteFooter({ settings }: { settings: SiteSettings }) {
  const [groups, year] = await Promise.all([getFooterGroups(), getCopyrightYear()])
  const social = Object.entries(settings.social).filter(([, url]) => Boolean(url))

  return (
    <footer className="mt-16 border-t border-border bg-surface" data-print="hide">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div className="max-w-xs">
          <div className="flex items-center gap-2.5 font-semibold text-text">
            <LogoMark className="size-7" />
            {settings.site_name}
          </div>
          {social.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-small">
              {social.map(([key, url]) => (
                <li key={key}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted hover:text-accent-ink"
                  >
                    {SOCIAL_LABELS[key] ?? key}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {groups.map((group) => (
          <nav key={group.label} aria-label={group.label}>
            <h2 className="text-small font-semibold text-text">{group.label}</h2>
            <ul className="mt-3 space-y-1">
              {group.links.map((link) => (
                <li key={link.id}>
                  <Link
                    href={link.href}
                    className="inline-flex min-h-9 items-center text-small text-muted hover:text-accent-ink"
                    {...(link.openInNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-border">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {settings.organization.legal_name || settings.site_name}. An independent study
            resource — not affiliated with or endorsed by IIT Madras.
          </p>
          <ConsentSettingsButton className="self-start text-xs text-muted underline-offset-2 hover:text-text hover:underline sm:self-auto" />
        </div>
      </div>
    </footer>
  )
}
