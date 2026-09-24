import 'server-only'

import rehypeShikiFromHighlighter from '@shikijs/rehype/core'
import type { Element, ElementContent, Root as HastRoot } from 'hast'
import { toString as hastToString } from 'hast-util-to-string'
import type { Image, Paragraph, PhrasingContent, Root as MdastRoot, RootContent } from 'mdast'
import type {} from 'mdast-util-mdx'
import type { MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx-jsx'
import rehypeKatex, { type Options as KatexOptions } from 'rehype-katex'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkMdx from 'remark-mdx'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'
import { VFile } from 'vfile'

import { BLOCK_ELEMENTS } from './allowed'
import { CODE_THEMES, getHighlighter } from './highlighter'
import { remarkSanitizeMdx, type SanitizeReport } from './sanitize'

export type TocItem = { id: string; text: string; depth: 2 | 3 }

export type ProcessedMdx = {
  tree: HastRoot
  toc: TocItem[]
  /** Cloudinary public ids referenced by images (for alt text and sizes). */
  imageIds: string[]
  /** "markdown" when the MDX failed to parse and plain Markdown was used. */
  mode: 'mdx' | 'markdown'
  error: string | null
  report: SanitizeReport | null
}

export type ProcessOptions = {
  /** Shift heading levels down, e.g. 2 turns "##" into <h4> inside a card. */
  headingOffset?: number
  /** Collect h2/h3 into a table of contents. */
  toc?: boolean
}

const MDX_NODE_TYPES = [
  'mdxjsEsm',
  'mdxFlowExpression',
  'mdxJsxFlowElement',
  'mdxJsxTextElement',
  'mdxTextExpression',
] as const

const CLOUDINARY_SCHEME = /^cloudinary:/i

/** Marks Cloudinary images ("cloudinary:<public id>") and records their ids. */
function remarkImages() {
  return (tree: MdastRoot, file: VFile) => {
    const ids: string[] = []
    visit(tree, 'image', (node: Image) => {
      if (CLOUDINARY_SCHEME.test(node.url)) {
        const publicId = node.url.replace(CLOUDINARY_SCHEME, '').replace(/^\/+/, '')
        node.url = publicId
        node.data = {
          ...node.data,
          hProperties: { ...(node.data?.hProperties ?? {}), dataCloudinary: 'true' },
        }
        ids.push(publicId)
      }
    })
    file.data.imageIds = ids
  }
}

const isBlockElement = (node: PhrasingContent): node is MdxJsxTextElement =>
  node.type === 'mdxJsxTextElement' && BLOCK_ELEMENTS.has(node.name ?? '')

/**
 * A component written on one line with its text ("<Callout>Check the
 * handbook.</Callout>") is parsed as part of a paragraph, which would put an
 * <aside> or <figure> inside <p>: invalid HTML that browsers re-nest, breaking
 * hydration. Lift such components out; text around them stays a paragraph.
 */
function remarkLiftBlocks() {
  return (tree: MdastRoot) => {
    visit(tree, 'paragraph', (node: Paragraph, index, parent) => {
      if (!parent || index === undefined || !node.children.some(isBlockElement)) return
      const lifted: RootContent[] = []
      let run: PhrasingContent[] = []
      const flush = () => {
        if (run.some((child) => child.type !== 'text' || child.value.trim() !== '')) {
          lifted.push({ type: 'paragraph', children: run })
        }
        run = []
      }
      for (const child of node.children) {
        if (!isBlockElement(child)) {
          run.push(child)
          continue
        }
        flush()
        const block: MdxJsxFlowElement = {
          type: 'mdxJsxFlowElement',
          name: child.name,
          attributes: child.attributes,
          // Phrasing content is valid inside these components' block wrappers.
          children: child.children as unknown as MdxJsxFlowElement['children'],
          position: child.position,
        }
        lifted.push(block)
      }
      flush()
      parent.children.splice(index, 1, ...(lifted as typeof parent.children))
      return index + lifted.length
    })
  }
}

function rehypeHeadingOffset(offset: number) {
  return () => (tree: HastRoot) => {
    if (!offset) return
    visit(tree, 'element', (node: Element) => {
      const match = /^h([1-6])$/.exec(node.tagName)
      if (match) node.tagName = `h${Math.min(6, Number(match[1]) + offset)}`
    })
  }
}

/** Wraps tables so they scroll horizontally on narrow screens. */
function rehypeWrapTables() {
  return (tree: HastRoot) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (node.tagName !== 'table' || !parent || index === undefined) return
      const wrapper: Element = {
        type: 'element',
        tagName: 'div',
        properties: {
          className: ['table-scroll'],
          tabIndex: 0,
          role: 'region',
          ariaLabel: 'Table',
        },
        children: [node as ElementContent],
      }
      parent.children[index] = wrapper
    })
  }
}

function rehypeCollectToc() {
  return (tree: HastRoot, file: VFile) => {
    const toc: TocItem[] = []
    visit(tree, 'element', (node: Element) => {
      if (
        (node.tagName === 'h2' || node.tagName === 'h3') &&
        typeof node.properties?.id === 'string'
      ) {
        toc.push({
          id: node.properties.id,
          text: hastToString(node).trim(),
          depth: node.tagName === 'h2' ? 2 : 3,
        })
      }
    })
    file.data.toc = toc
  }
}

// rehype-katex already renders invalid TeX as an inline error instead of throwing.
const katexOptions: KatexOptions = { strict: 'ignore', trust: false }

async function build(mode: 'mdx' | 'markdown', options: ProcessOptions) {
  const highlighter = await getHighlighter()
  return unified()
    .use(remarkParse)
    .use(mode === 'mdx' ? [remarkMdx] : [])
    .use(remarkGfm)
    .use(remarkMath)
    .use(mode === 'mdx' ? [remarkSanitizeMdx, remarkLiftBlocks] : [])
    .use(remarkImages)
    .use(remarkRehype, { passThrough: [...MDX_NODE_TYPES] })
    .use(rehypeHeadingOffset(options.headingOffset ?? 0))
    .use(rehypeSlug)
    .use(rehypeKatex, katexOptions)
    .use(rehypeShikiFromHighlighter, highlighter, {
      themes: CODE_THEMES,
      defaultColor: false,
      fallbackLanguage: 'text',
      addLanguageClass: true,
    })
    .use(rehypeWrapTables)
    .use(options.toc ? rehypeCollectToc : () => undefined)
}

/**
 * MDX → sanitised HAST. Never throws: if the source is not valid MDX (a stray
 * "<" or "{" in prose), it is rendered as plain Markdown instead and the
 * error is returned so the admin can show it.
 */
export async function processMdx(
  source: string,
  options: ProcessOptions = {},
): Promise<ProcessedMdx> {
  const run = async (mode: 'mdx' | 'markdown') => {
    const processor = await build(mode, options)
    const file = new VFile({ value: source })
    const tree = (await processor.run(processor.parse(file), file)) as HastRoot
    return {
      tree,
      toc: (file.data.toc as TocItem[] | undefined) ?? [],
      imageIds: (file.data.imageIds as string[] | undefined) ?? [],
      mode,
      report: file.data.sanitize ?? null,
    }
  }

  try {
    return { ...(await run('mdx')), error: null }
  } catch (mdxError) {
    const message = mdxError instanceof Error ? mdxError.message : String(mdxError)
    try {
      return { ...(await run('markdown')), error: message }
    } catch (markdownError) {
      const fallback: HastRoot = {
        type: 'root',
        children: [
          {
            type: 'element',
            tagName: 'p',
            properties: {},
            children: [{ type: 'text', value: source }],
          },
        ],
      }
      return {
        tree: fallback,
        toc: [],
        imageIds: [],
        mode: 'markdown',
        error: `${message}; ${markdownError instanceof Error ? markdownError.message : String(markdownError)}`,
        report: null,
      }
    }
  }
}

declare module 'vfile' {
  interface DataMap {
    toc: TocItem[]
    imageIds: string[]
  }
}
