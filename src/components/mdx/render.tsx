import 'katex/dist/katex.min.css'

import { toJsxRuntime } from 'hast-util-to-jsx-runtime'
import type { ReactNode } from 'react'
import { Fragment, jsx, jsxs } from 'react/jsx-runtime'

import { getMediaMap } from '@/lib/data/media'
import { processMdx, type ProcessOptions, type TocItem } from '@/lib/mdx/process'
import { cn } from '@/lib/utils/cn'

import { createMdxComponents } from './components'

export type RenderedMdx = {
  content: ReactNode
  toc: TocItem[]
  error: string | null
}

/** Renders database MDX to React on the server (no client JavaScript). */
export async function renderMdx(source: string | null | undefined, options: ProcessOptions = {}): Promise<RenderedMdx> {
  if (!source || !source.trim()) return { content: null, toc: [], error: null }

  const processed = await processMdx(source, options)
  if (processed.error) {
    console.warn(`[mdx] rendered as markdown after an MDX error: ${processed.error}`)
  }
  const media = await getMediaMap(processed.imageIds)
  const content = toJsxRuntime(processed.tree, {
    Fragment,
    jsx,
    jsxs,
    // Allowed components receive string props only (enforced by the sanitiser).
    components: createMdxComponents({ media }) as never,
  })
  return { content, toc: processed.toc, error: processed.error }
}

export async function Mdx({
  source,
  className,
  headingOffset,
}: {
  source: string | null | undefined
  className?: string
  headingOffset?: number
}) {
  const { content } = await renderMdx(source, { headingOffset })
  if (!content) return null
  return <div className={cn('prose-content', className)}>{content}</div>
}
