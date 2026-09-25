import Link from 'next/link'

import { Logo } from '@/components/layout/logo'
import { getSiteSettings } from '@/lib/data/settings'
import { displayName } from '@/lib/settings/schema'

// Signed-in areas read cookies up front so auth redirects are real HTTP redirects.
export const instant = false

export default async function AuthLayout({ children }: LayoutProps<'/'>) {
  const settings = await getSiteSettings()
  return (
    <>
      <header className="border-b border-border">
        <div className="container-page flex h-16 items-center">
          <Logo siteName={displayName(settings)} />
        </div>
      </header>
      <main
        id="main"
        tabIndex={-1}
        className="flex flex-1 items-start justify-center px-4 py-12 outline-none sm:py-20"
      >
        {children}
      </main>
      <footer className="border-t border-border py-6 text-center text-xs text-muted">
        <Link href="/privacy" className="hover:text-text">
          Privacy
        </Link>
        <span aria-hidden="true"> · </span>
        <Link href="/terms" className="hover:text-text">
          Terms
        </Link>
      </footer>
    </>
  )
}
