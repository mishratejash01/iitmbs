import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

import { LogoMark } from '@/components/layout/logo'
import { cn } from '@/lib/utils/cn'

type Promo = {
  href: string
  title: string
  ribbon: string
  note: string
  books: string[]
  cta: string
  look: {
    card: string
    ribbon: string
    note: string
    cta: string
    dark: boolean
  }
}

// Book covers on the shelf cycle through the highlights.
const BOOK_TONES = ['bg-lime', 'bg-violet', 'bg-sky', 'bg-sun'] as const

const PROMOS: Promo[] = [
  {
    href: '/qualifier',
    title: 'Clear your qualifier, week by week',
    ribbon: 'Concepts · Hints · Solutions',
    note: 'For Data Science and Electronic Systems',
    books: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    cta: 'Start now',
    look: {
      card: 'bg-accent-strong text-on-accent',
      ribbon: 'bg-lime text-accent-strong',
      note: 'text-on-accent/80',
      cta: 'bg-lime text-accent-strong',
      dark: true,
    },
  },
  {
    href: '/pyq',
    title: 'Previous year papers with answers',
    ribbon: 'Quiz 1 · Quiz 2 · End term',
    note: 'Foundation to degree courses',
    books: ['Quiz 1', 'Quiz 2', 'End term', 'OPPE'],
    cta: 'Practise now',
    look: {
      card: 'bg-accent-soft text-accent-strong',
      ribbon: 'bg-accent-strong text-on-accent',
      note: 'text-text',
      cta: 'bg-accent-strong text-on-accent',
      dark: false,
    },
  },
  {
    href: '/notes',
    title: 'Notes for every course',
    ribbon: 'Handwritten and PDF',
    note: 'Shared by IITM BS students',
    books: ['Foundation', 'Diploma', 'Degree'],
    cta: 'Browse notes',
    look: {
      card: 'bg-sun/40 text-text',
      ribbon: 'bg-accent-strong text-on-accent',
      note: 'text-text',
      cta: 'bg-accent-strong text-on-accent',
      dark: false,
    },
  },
]

/**
 * The sidebar's promotional banners, in the style of a study store's ads: a
 * headline, a ribbon, a shelf of "books" and a button. They advertise the
 * site's own sections. Each banner is one link.
 */
export function PromoBanners({ siteName }: { siteName: string }) {
  return (
    <ul aria-label={`From ${siteName}`} className="space-y-5">
      {PROMOS.map((promo) => (
        <li key={promo.href}>
          <Link
            href={promo.href}
            className={cn(
              'group flex flex-col items-center rounded-card px-6 pt-6 pb-7 text-center transition-opacity hover:opacity-95',
              promo.look.card,
            )}
            data-track="nav_click"
            data-track-label={`blog_promo:${promo.href}`}
          >
            <span className="flex items-center gap-2 text-[0.6875rem] font-bold tracking-[0.14em] uppercase">
              <LogoMark inverse={promo.look.dark} className="size-5" />
              {siteName}
            </span>
            <span className="mt-3 text-[1.375rem] leading-7 font-bold">{promo.title}</span>
            <span
              className={cn(
                'mt-3 rounded-control px-3 py-1 text-xs font-bold tracking-wide',
                promo.look.ribbon,
              )}
            >
              {promo.ribbon}
            </span>
            <span className={cn('mt-2 text-xs', promo.look.note)}>{promo.note}</span>

            {/* The shelf: book covers standing on a board. */}
            <span aria-hidden="true" className="mt-6 flex w-full flex-col items-center">
              <span className="flex items-end justify-center gap-2">
                {promo.books.map((book, index) => (
                  <span
                    key={book}
                    className={cn(
                      'flex h-24 w-[4.25rem] flex-col items-center justify-between px-1 pt-2.5 pb-2 text-center text-accent-strong shadow-card',
                      BOOK_TONES[index % BOOK_TONES.length],
                    )}
                  >
                    <span className="text-[0.5625rem] leading-tight font-bold tracking-wide uppercase">
                      {book}
                    </span>
                    <span className="h-1 w-full bg-card/80" />
                  </span>
                ))}
              </span>
              <span
                className={cn(
                  'h-2 w-full max-w-[20rem]',
                  promo.look.dark ? 'bg-on-accent/25' : 'bg-accent-strong/20',
                )}
              />
            </span>

            <span
              className={cn(
                'mt-6 inline-flex min-h-10 items-center gap-1.5 rounded-full px-5 text-small font-bold',
                promo.look.cta,
              )}
            >
              {promo.cta}
              <ArrowRight
                aria-hidden="true"
                className="size-4 transition-transform group-hover:translate-x-0.5"
              />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
