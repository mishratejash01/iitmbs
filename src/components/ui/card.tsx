import Link from 'next/link'
import type { HTMLAttributes, ReactNode } from 'react'

import { cn } from '@/lib/utils/cn'

export const cardClasses = 'rounded-card border border-border bg-card'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(cardClasses, className)} {...props} />
}

/**
 * A whole-card link. The accessible name comes from the heading inside; the
 * hover state is a quiet border change rather than a shadow.
 */
export function LinkCard({
  href,
  className,
  children,
  ...props
}: { href: string; className?: string; children: ReactNode } & Omit<
  HTMLAttributes<HTMLAnchorElement>,
  'href'
>) {
  return (
    <Link
      href={href}
      className={cn(
        cardClasses,
        'group block p-4 transition-colors duration-150 hover:border-accent sm:p-5',
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  )
}
