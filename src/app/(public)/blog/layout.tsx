import { Reddit_Sans } from 'next/font/google'

// Only blog pages download it.
const redditSans = Reddit_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-reddit-sans',
})

/**
 * Blog pages read like a study-guide publication: Reddit Sans for titles and
 * cards, articles in Helvetica/Arial (see .prose-article), square corners.
 */
export default function BlogLayout({ children }: LayoutProps<'/blog'>) {
  return (
    <div
      className={`${redditSans.variable} font-blog [--radius-card:0px] [--radius-control:0px] [--radius-panel:0px]`}
    >
      {children}
    </div>
  )
}
