import type { ReactNode } from 'react'

import { getSiteSettings } from '@/lib/data/settings'

export async function SiteName() {
  const settings = await getSiteSettings()
  return <>{settings.site_name}</>
}

export async function ContactEmail() {
  const settings = await getSiteSettings()
  const email = settings.contact.email
  if (!email) return <span>the contact form on this page</span>
  return (
    <a href={`mailto:${email}`} className="font-medium">
      {email}
    </a>
  )
}

export async function ContactLink({ children }: { children?: ReactNode }) {
  const settings = await getSiteSettings()
  const href = settings.contact.email ? `mailto:${settings.contact.email}` : '/contact'
  return <a href={href}>{children ?? 'contact us'}</a>
}
