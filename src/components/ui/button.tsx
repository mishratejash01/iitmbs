import Link, { type LinkProps } from 'next/link'
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'

import { cn } from '@/lib/utils/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'soft' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 rounded-control font-medium whitespace-nowrap ' +
  'transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 select-none'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-accent-strong text-on-accent hover:brightness-95 active:brightness-90',
  secondary:
    'border border-border-strong bg-card text-text hover:border-accent hover:text-accent-ink',
  soft: 'bg-accent-soft text-accent-ink hover:brightness-[0.97]',
  ghost: 'text-text hover:bg-surface',
}

// Every size keeps a 44px minimum touch target on mobile.
const sizes: Record<ButtonSize, string> = {
  sm: 'min-h-11 sm:min-h-9 px-3 text-small',
  md: 'min-h-11 px-4 text-body',
  lg: 'min-h-12 px-6 text-body',
}

export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className?: string) {
  return cn(base, variants[variant], sizes[size], className)
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }

export function Button({ variant, size, className, type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses(variant, size, className)} {...props} />
}

type ButtonLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    variant?: ButtonVariant
    size?: ButtonSize
    children: ReactNode
  }

export function ButtonLink({ variant, size, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClasses(variant, size, className)} {...props} />
}
