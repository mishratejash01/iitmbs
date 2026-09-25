import { ArrowRight, Award, GraduationCap, Layers, type LucideIcon, Rocket } from 'lucide-react'
import Link from 'next/link'

import { cn } from '@/lib/utils/cn'

export type LevelCard = {
  id: 'qualifier' | 'foundation' | 'diploma' | 'degree'
  label: string
  stats: string[]
  links: Array<{ label: string; href: string }>
}

const LOOK: Record<LevelCard['id'], { icon: LucideIcon; card: string; chip: string }> = {
  qualifier: { icon: Rocket, card: 'bg-accent-strong text-on-accent', chip: 'bg-lime' },
  foundation: { icon: Layers, card: 'bg-accent-soft text-text', chip: 'bg-card' },
  diploma: { icon: GraduationCap, card: 'bg-sky/35 text-text', chip: 'bg-card' },
  degree: { icon: Award, card: 'bg-sun/35 text-text', chip: 'bg-card' },
}

/** The degree's levels as colour cards (the qualifier card is marked "Start here" when shown). */
export function LevelCards({ levels }: { levels: LevelCard[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {levels.map((level) => {
        const look = LOOK[level.id]
        const dark = level.id === 'qualifier'
        return (
          <li key={level.id} className={cn('flex flex-col rounded-panel p-6 sm:p-7', look.card)}>
            <div className="flex items-center justify-between gap-3">
              <span
                aria-hidden="true"
                className={cn(
                  'flex size-11 items-center justify-center rounded-full text-accent-strong',
                  look.chip,
                )}
              >
                <look.icon className="size-5" />
              </span>
              {dark ? (
                <span className="rounded-full bg-lime px-3 py-1 text-xs font-bold text-accent-strong">
                  Start here
                </span>
              ) : null}
            </div>
            <h3 className="mt-5 text-[1.5rem] leading-8 font-bold tracking-tight">{level.label}</h3>
            {level.stats.length > 0 ? (
              <p
                className={cn(
                  'mt-4 text-small font-medium',
                  dark ? 'text-lime' : 'text-accent-ink',
                )}
              >
                {level.stats.join(' · ')}
              </p>
            ) : null}
            <ul className="mt-auto space-y-1 pt-6">
              {level.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      'group inline-flex min-h-10 items-center gap-1.5 text-small font-medium underline underline-offset-4',
                      dark
                        ? 'decoration-on-accent/40 hover:decoration-on-accent'
                        : 'decoration-accent-strong/30 hover:decoration-accent-strong',
                    )}
                    data-track="nav_click"
                    data-track-label={`home_level:${level.id}`}
                  >
                    {link.label}
                    <ArrowRight
                      aria-hidden="true"
                      className="size-4 transition-transform group-hover:translate-x-0.5"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        )
      })}
    </ul>
  )
}
