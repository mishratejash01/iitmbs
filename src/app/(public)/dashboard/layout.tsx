import { requireUser } from '@/lib/auth/session'

import { DashboardNav } from '@/components/dashboard/dashboard-nav'

// Personal pages: read the session up front so signed-out visitors get a real redirect.
export const instant = false

export default async function DashboardLayout({ children }: LayoutProps<'/dashboard'>) {
  await requireUser('/dashboard')
  return (
    <div className="container-page py-8 sm:py-10">
      <DashboardNav />
      <div className="mt-6">{children}</div>
    </div>
  )
}
