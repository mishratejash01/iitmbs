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
    <footer className="mt-20 bg-accent-strong text-on-accent" data-print="hide">
      <div className="container-page grid gap-10 pt-16 pb-12 md:grid-cols-[1.5fr_repeat(4,1fr)]">
        <div className="max-w-xs">
          <div className="flex items-center gap-2.5 text-[1.125rem] font-semibold">
            <LogoMark inverse className="size-8" />
            {settings.site_name}
          </div>
          <p className="mt-4 text-small text-on-accent/75">
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
                    className="text-accent-soft underline-offset-4 hover:underline"
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
            <h2 className="text-small font-semibold text-accent-soft">{group.label}</h2>
            <ul className="mt-3 space-y-0.5">
              {group.links.map((link) => (
                <li key={link.id}>
                  <Link
                    href={link.href}
                    className="inline-flex min-h-9 items-center text-small text-on-accent/80 underline-offset-4 hover:text-on-accent hover:underline"
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

      <div className="border-t border-on-accent/15">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-on-accent/70 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {settings.organization.legal_name || settings.site_name}. An independent study
            resource, not affiliated with or endorsed by IIT Madras.
          </p>
          <ConsentSettingsButton className="self-start text-xs text-on-accent/70 underline-offset-2 hover:text-on-accent hover:underline sm:self-auto" />
        </div>
      </div>
    </footer>
  )
}
