import 'server-only'

import type { Element, ElementContent, Root } from 'hast'
import { toHtml } from 'hast-util-to-html'
import type { MdxJsxFlowElementHast, MdxJsxTextElementHast } from 'mdast-util-mdx-jsx'
import { visit } from 'unist-util-visit'

import { cloudinaryImageUrl } from '@/lib/cloudinary/url'
import { processMdx } from '@/lib/mdx/process'

type Jsx = MdxJsxFlowElementHast | MdxJsxTextElementHast

const attr = (node: Jsx, name: string) => {
  const found = node.attributes.find((a) => a.type === 'mdxJsxAttribute' && a.name === name)
  return found && found.type === 'mdxJsxAttribute' && typeof found.value === 'string'
    ? found.value
    : undefined
}

const el = (tagName: string, className: string, children: ElementContent[] = []): Element => ({
  type: 'element',
  tagName,
  properties: { className: [className] },
  children,
})

const text = (value: string): ElementContent => ({ type: 'text', value })

/** Turns allowed MDX components into static HTML stand-ins for the editor preview. */
function toPlaceholder(node: Jsx): Element {
  switch (node.name) {
    case 'Callout':
      return el(
        'aside',
        `preview-callout preview-callout-${attr(node, 'type') ?? 'info'}`,
        node.children as ElementContent[],
      )
    case 'KeyIdea':
    case 'Steps':
    case 'Definition':
      return el('div', 'preview-block', [
        el('strong', 'preview-label', [text(node.name)]),
        ...(node.children as ElementContent[]),
      ])
    case 'RelatedLink': {
      const link = el('a', 'preview-related', [
        text(`→ ${attr(node, 'title') ?? attr(node, 'href') ?? 'link'}`),
      ])
      link.properties.href = attr(node, 'href') ?? '#'
      return link
    }
    case 'Figure': {
      const image = el('img', 'preview-figure')
      image.properties.src = cloudinaryImageUrl(attr(node, 'src') ?? '', { width: 720 })
      image.properties.alt = attr(node, 'alt') ?? ''
      return image
    }
    default:
      return el('div', 'preview-placeholder', [
        text(
          `[${node.name ?? 'component'}${attr(node, 'program') ? ` ${attr(node, 'program')}` : ''}]`,
        ),
      ])
  }
}

export type MdxPreview = { html: string; error: string | null; removed: string[] }

/** Renders MDX to HTML for the admin preview with the live site's pipeline. */
export async function renderMdxPreview(source: string): Promise<MdxPreview> {
  const processed = await processMdx(source)
  const tree: Root = structuredClone(processed.tree)
  visit(tree, (node, index, parent) => {
    if (
      (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') &&
      parent &&
      index !== undefined
    ) {
      parent.children[index] = toPlaceholder(node as Jsx)
    }
  })
  visit(tree, 'element', (node: Element) => {
    if (node.tagName === 'img' && node.properties.dataCloudinary === 'true') {
      node.properties.src = cloudinaryImageUrl(String(node.properties.src ?? ''), { width: 720 })
    }
  })
  const report = processed.report
  const removed = report
    ? [
        ...(report.removedEsm ? [`${report.removedEsm} import/export statement(s)`] : []),
        ...(report.removedExpressions ? [`${report.removedExpressions} {expression}(s)`] : []),
        ...report.unwrappedElements.map((name) => `<${name}> is not an allowed component`),
        ...report.droppedAttributes.map((a) => `attribute ${a}`),
      ]
    : []
  return { html: toHtml(tree), error: processed.error, removed }
}
