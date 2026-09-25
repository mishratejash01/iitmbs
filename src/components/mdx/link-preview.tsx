import { LinkCard } from '@/components/content/link-card'
import { env } from '@/env'
import { getLinkIndex } from '@/lib/data/links'
import { describeLink } from '@/lib/links/describe'

import { SmartLink } from './smart-link'
import { YouTube } from './youtube'

/**
 * A link written on its own line, shown with a preview: YouTube links play
 * in place, pages on this site show their title and summary, other sites a
 * card with their address. Anything else stays a plain link.
 */
export async function LinkPreview({ href, title }: { href?: string; title?: string }) {
  if (!href) return null
  const target = describeLink(href, env.siteUrl)
  const label = title?.trim() || href

  if (target?.kind === 'youtube') return <YouTube id={target.id} title={label} />

  if (target?.kind === 'internal') {
    const index = await getLinkIndex()
    const entry = index[target.path.split('#')[0] ?? target.path]
    if (entry) {
      return (
        <div className="my-6">
          <LinkCard
            href={target.path}
            title={entry.title}
            summary={entry.summary}
            host={new URL(env.siteUrl).host}
            internal
          />
        </div>
      )
    }
  }

  if (target?.kind === 'external') {
    return (
      <div className="my-6">
        <LinkCard
          href={target.url}
          title={label === href ? target.host : label}
          host={target.host}
          official={target.official}
        />
      </div>
    )
  }

  return (
    <p>
      <SmartLink href={href}>{label}</SmartLink>
    </p>
  )
}
