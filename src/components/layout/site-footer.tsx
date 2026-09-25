import Link from 'next/link'

import { ConsentSettingsButton } from '@/components/consent/consent-settings-button'
import { getCopyrightYear } from '@/lib/data/copyright'
import { getFooterGroups } from '@/lib/data/navigation'
import { displayName, type SiteSettings } from '@/lib/settings/schema'

import { LogoMark, Wordmark } from './logo'

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
    <footer className="mt-20 border-t border-border bg-surface text-text" data-print="hide">
      <div className="container-page grid gap-10 pt-16 pb-12 md:grid-cols-[1.5fr_repeat(4,1fr)]">
        <div className="max-w-xs">
          <div className="flex items-center gap-2.5 text-text">
            <LogoMark className="size-9" />
            <Wordmark name={displayName(settings)} className="text-[1.0625rem]" />
          </div>
          <p className="mt-4 text-small text-muted">
            Free week-by-week help, notes and previous year papers for the IIT Madras BS degree.
          </p>
          {social.length > 0 ? (
            <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-small">
              {social.map(([key, url]) => (
                <li key={key}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-accent-ink underline-offset-4 hover:underline"
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
            <ul className="mt-3 space-y-0.5">
              {group.links.map((link) => (
                <li key={link.id}>
                  <Link
                    href={link.href}
                    className="inline-flex min-h-9 items-center text-small text-muted underline-offset-4 hover:text-accent-ink hover:underline"
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
            © {year} {settings.organization.legal_name || displayName(settings)}. An independent
            study resource, not affiliated with or endorsed by IIT Madras.
          </p>
          <ConsentSettingsButton className="self-start text-xs text-muted underline-offset-2 hover:text-text hover:underline sm:self-auto" />
        </div>
      </div>
    </footer>
  )
}
