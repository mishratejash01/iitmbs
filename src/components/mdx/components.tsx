import type { ComponentProps } from 'react'

import type { MediaInfo } from '@/lib/data/media'

import { KeyIdea, Definition, Steps } from './blocks'
import { EligibilityCalculator, ScoreCalculator } from './calculators'
import { Callout } from './callout'
import { CodeBlock } from './code-block'
import { Figure } from './figure'
import { headingWithAnchor } from './heading'
import { LinkPreview } from './link-preview'
import { RelatedLink } from './related-link'
import { ContactEmail, ContactLink, SiteName } from './site-bits'
import { SmartLink } from './smart-link'
import { SyllabusOverview } from './syllabus-overview'
import { YouTube } from './youtube'

/**
 * Element overrides and custom components available to MDX. Keep in sync
 * with ALLOWED_COMPONENTS in src/lib/mdx/allowed.ts — anything not allowed
 * there is stripped before rendering.
 */
export function createMdxComponents({ media }: { media: Record<string, MediaInfo> }) {
  return {
    a: SmartLink,
    h2: headingWithAnchor('h2'),
    h3: headingWithAnchor('h3'),
    h4: headingWithAnchor('h4'),
    h5: headingWithAnchor('h5'),
    h6: headingWithAnchor('h6'),
    pre: CodeBlock,
    img: ({ src, alt, ...rest }: ComponentProps<'img'> & { 'data-cloudinary'?: string }) => {
      const source = typeof src === 'string' ? src : ''
      if (rest['data-cloudinary'] === 'true' || !/^https?:\/\//.test(source)) {
        return <Figure src={source} alt={alt} media={media[source]} />
      }
      // External images are discouraged (and blocked by CSP unless allowed).
      return (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary external URL; next/image needs known hosts
        <img
          src={source}
          alt={alt ?? ''}
          loading="lazy"
          decoding="async"
          className="h-auto max-w-full"
        />
      )
    },
    Callout,
    RelatedLink,
    LinkPreview,
    SiteName,
    ContactEmail,
    ContactLink,
    SyllabusOverview,
    EligibilityCalculator,
    ScoreCalculator,
    Figure: (props: ComponentProps<typeof Figure>) => (
      <Figure
        {...props}
        media={props.src ? media[props.src.replace(/^cloudinary:/i, '')] : undefined}
      />
    ),
    YouTube,
    KeyIdea,
    Steps,
    Definition,
  }
}
