import { ArrowUpRight, CalendarDays, MapPin } from 'lucide-react'

import { LogoMark } from '@/components/layout/logo'
import { ButtonLink } from '@/components/ui/button'

const WEEK_TONES = ['bg-lime', 'bg-violet', 'bg-sky', 'bg-sun'] as const

export type BannerLink = { label: string; href: string; external?: boolean }

/**
 * The current qualifier term as an event banner with a row of buttons under
 * it: apply on the official site, eligibility, the timeline. The dates come
 * from the announcement setting, so the banner is updated with it.
 */
export function TermBanner({
  brand,
  term,
  dates,
  links,
}: {
  brand: string
  term: string
  dates: string | null
  links: BannerLink[]
}) {
  return (
    <section aria-labelledby="term-banner" className="container-page pt-12 sm:pt-16">
      <div className="grid overflow-hidden rounded-panel bg-accent-strong text-on-accent lg:grid-cols-[1.15fr_1fr]">
        <div className="p-7 sm:p-10 lg:p-12">
          <p className="flex items-center gap-2.5 text-small">
            <LogoMark inverse className="size-7" />
            {brand}
          </p>
          <p className="mt-6 text-small font-medium tracking-[0.12em] text-lime uppercase">
            {term} qualifier
          </p>
          <h2
            id="term-banner"
            className="mt-2 text-[2.25rem] leading-[2.75rem] font-bold tracking-tight sm:text-[3rem] sm:leading-[3.5rem]"
          >
            Your qualifier
            <span className="block text-lime">starts here</span>
          </h2>
          <p className="mt-4 max-w-md text-[1.0625rem] leading-7 text-on-accent/85">
            Four weeks of graded assignments, then one exam. We help with every week.
          </p>
          <ul className="mt-6 space-y-2.5 text-[0.9375rem]">
            {dates ? (
              <li className="flex items-start gap-3">
                <CalendarDays aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-lime" />
                {dates}
              </li>
            ) : null}
            <li className="flex items-start gap-3">
              <MapPin aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-lime" />
              Weekly work online, exam in person at a centre
            </li>
          </ul>
        </div>

        {/* The term at a glance: four weeks, then the exam. */}
        <div
          aria-hidden="true"
          className="hidden items-center justify-center bg-on-accent/5 p-10 lg:flex"
        >
          <div className="w-full max-w-sm -rotate-2 rounded-card bg-card p-6 text-text shadow-card">
            <p className="text-small font-semibold">Your 4 weeks</p>
            <ul className="mt-4 space-y-3">
              {WEEK_TONES.map((tone, index) => (
                <li key={tone} className="flex items-center gap-3">
                  <span className={`size-3 shrink-0 rounded-full ${tone}`} />
                  <span className="w-16 shrink-0 text-small">Week {index + 1}</span>
                  <span className="h-2 flex-1 rounded-full bg-surface">
                    <span
                      className={`block h-full rounded-full ${tone}`}
                      style={{ width: `${100 - index * 18}%` }}
                    />
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-5 flex items-center justify-between border-t border-border pt-4 text-small">
              Qualifier exam
              <span className="rounded-full bg-green px-2.5 py-0.5 text-xs font-medium">
                Hall ticket
              </span>
            </p>
          </div>
        </div>
      </div>

      {links.length > 0 ? (
        <ul className="mt-8 flex flex-wrap justify-center gap-3 sm:gap-4">
          {links.map((link) => (
            <li key={link.href} className="w-full sm:w-auto">
              <ButtonLink
                href={link.href}
                size="lg"
                className="min-h-12 w-full px-6 text-[1.0625rem] sm:w-auto"
                data-track="nav_click"
                data-track-label={`term_banner:${link.label}`}
                {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                {link.label}
                {link.external ? (
                  <>
                    <ArrowUpRight aria-hidden="true" className="size-4" />
                    <span className="sr-only">(opens in a new tab)</span>
                  </>
                ) : null}
              </ButtonLink>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
