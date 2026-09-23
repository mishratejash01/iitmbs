import type { Root, RootContent } from 'mdast'
import type { MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx-jsx'
import { SKIP, visit } from 'unist-util-visit'
import type { VFile } from 'vfile'

import { allowedAttributes, isAllowedElement } from './allowed'

type JsxElement = MdxJsxFlowElement | MdxJsxTextElement

export type SanitizeReport = {
  removedEsm: number
  removedExpressions: number
  unwrappedElements: string[]
  droppedAttributes: string[]
}

function isJsx(node: { type: string }): node is JsxElement {
  return node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement'
}

function keepAttribute(element: string, attribute: JsxElement['attributes'][number]): boolean {
  if (attribute.type !== 'mdxJsxAttribute') return false
  if (!allowedAttributes(element).includes(attribute.name)) return false
  // Only literal strings or bare booleans (<details open>) — never expressions.
  return (
    attribute.value === null || attribute.value === undefined || typeof attribute.value === 'string'
  )
}

/**
 * remark plugin: strips everything that could execute code or inject markup
 * from MDX parsed out of the database. Writes a report to `file.data.sanitize`
 * so the admin can warn authors about removed constructs.
 */
export function remarkSanitizeMdx() {
  return (tree: Root, file: VFile) => {
    const report: SanitizeReport = {
      removedEsm: 0,
      removedExpressions: 0,
      unwrappedElements: [],
      droppedAttributes: [],
    }

    visit(tree, (node, index, parent) => {
      if (!parent || index === undefined) return

      if (node.type === 'mdxjsEsm') {
        report.removedEsm += 1
        parent.children.splice(index, 1)
        return [SKIP, index]
      }

      if (node.type === 'mdxFlowExpression' || node.type === 'mdxTextExpression') {
        report.removedExpressions += 1
        parent.children.splice(index, 1)
        return [SKIP, index]
      }

      if (isJsx(node)) {
        if (!isAllowedElement(node.name)) {
          // Unknown element or fragment: keep its content, drop the wrapper.
          report.unwrappedElements.push(node.name ?? 'fragment')
          parent.children.splice(index, 1, ...(node.children as RootContent[]))
          return [SKIP, index]
        }
        const name = node.name
        const kept = node.attributes.filter((attribute) => {
          const keep = keepAttribute(name, attribute)
          if (!keep) {
            report.droppedAttributes.push(
              `${name}.${attribute.type === 'mdxJsxAttribute' ? attribute.name : '{…}'}`,
            )
          }
          return keep
        })
        node.attributes = kept
      }
      return undefined
    })

    file.data.sanitize = report
  }
}

declare module 'vfile' {
  interface DataMap {
    sanitize: SanitizeReport
  }
}
