import 'katex/dist/katex.min.css'

import { toJsxRuntime } from 'hast-util-to-jsx-runtime'
import { cacheLife } from 'next/cache'
import type { ReactNode } from 'react'
import { Fragment, jsx, jsxs } from 'react/jsx-runtime'

import { getMediaMap } from '@/lib/data/media'
import { processMdx, type ProcessedMdx, type ProcessOptions, type TocItem } from '@/lib/mdx/process'
import { cn } from '@/lib/utils/cn'

import { createMdxComponents } from './components'

/**
 * hast-util-to-jsx-runtime treats capitalised JSX names (<Callout>) as
 * JavaScript identifiers and asks an "evaluater" to resolve them. This one
 * resolves ONLY identifiers that name an allowed component; anything else
 * throws. Real expressions never reach it — the sanitiser removed them.
 */
function componentResolver(components: Record<string, unknown>) {
  const resolve = (expression: { type: string; name?: string }) => {
    if (
      expression.type === 'Identifier' &&
      expression.name &&
      Object.hasOwn(components, expression.name)
    ) {
      return components[expression.name]
    }
    throw new Error(`Unsupported MDX expression (${expression.type})`)
  }
  return {
    evaluateExpression: resolve as never,
    evaluateProgram: (() => {
      throw new Error('MDX programs are not supported')
    }) as never,
  }
}

export type RenderedMdx = {
  content: ReactNode
  toc: TocItem[]
  error: string | null
}

/**
 * Parsing and highlighting are pure functions of the source, so results are
 * cached by content. This also keeps the async work (Shiki loads grammars
 * lazily) inside a cache boundary, as Cache Components requires.
 */
async function processCached(
  source: string,
  headingOffset: number,
  toc: boolean,
): Promise<ProcessedMdx> {
  'use cache'
  cacheLife('max')
  return processMdx(source, { headingOffset, toc })
}

/** Renders database MDX to React on the server (no client JavaScript). */
export async function renderMdx(
  source: string | null | undefined,
  options: ProcessOptions = {},
): Promise<RenderedMdx> {
  if (!source || !source.trim()) return { content: null, toc: [], error: null }

  const processed = await processCached(source, options.headingOffset ?? 0, options.toc ?? false)
  if (processed.error) {
    console.warn(`[mdx] rendered as markdown after an MDX error: ${processed.error}`)
  }
  const media = await getMediaMap(processed.imageIds)
  const components = createMdxComponents({ media })
  const content = toJsxRuntime(processed.tree, {
    Fragment,
    jsx,
    jsxs,
    // Allowed components receive string props only (enforced by the sanitiser).
    components: components as never,
    createEvaluater: () => componentResolver(components),
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
