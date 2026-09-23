import { SettingsForm } from '@/components/admin/settings-form'
import { AdminHeader } from '@/components/admin/ui'
import { adminDb } from '@/lib/admin/records'
import { requireAdmin } from '@/lib/auth/session'
import { parseSiteSettings } from '@/lib/settings/schema'

// Admin-only and always fresh: renders on request, never from a prefetch.
export const instant = false

export default async function SettingsPage() {
  await requireAdmin()
  // Read the row directly (not the cached copy) so the form shows what is stored.
  const db = await adminDb()
  const { data } = await db.from('site_settings').select('data').eq('id', true).maybeSingle()
  const settings = parseSiteSettings(data?.data ?? {})

  return (
    <>
      <AdminHeader
        title="Settings"
        description="Site-wide configuration. Changes apply to every page as soon as they are saved."
      />
      <SettingsForm initial={settings} />
    </>
  )
}
