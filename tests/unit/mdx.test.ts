import { toHtml } from 'hast-util-to-html'
import { toString as hastToString } from 'hast-util-to-string'
import { describe, expect, it } from 'vitest'

import { processMdx } from '@/lib/mdx/process'

async function html(source: string, options = {}) {
  const result = await processMdx(source, options)
  return { ...result, html: toHtml(result.tree) }
}

describe('processMdx', () => {
  it('renders markdown, GFM tables and headings with ids', async () => {
    const { html: out, mode, error } = await html('## Sets\n\n| a | b |\n|---|---|\n| 1 | 2 |')
    expect(error).toBeNull()
    expect(mode).toBe('mdx')
    expect(out).toContain('<h2 id="sets">')
    expect(out).toContain('class="table-scroll"')
  })

  it('renders inline and display maths with KaTeX, including braces', async () => {
    const { html: out, error } = await html('A set $A = \\{1, 2\\}$.\n\n$$\n\\sum_{i=1}^{n} i\n$$')
    expect(error).toBeNull()
    expect(out).toContain('class="katex"')
    expect(out).toContain('katex-display')
  })

  it('highlights code with dual themes', async () => {
    const { html: out } = await html('```python\nprint("hi")\n```')
    expect(out).toContain('shiki')
    expect(out).toContain('--shiki-dark')
  })

  it('removes imports, exports and expressions', async () => {
    const result = await html('import x from "y"\n\nexport const a = 1\n\nHello {alert(1)} world')
    expect(result.html).not.toContain('alert')
    expect(result.report?.removedEsm).toBe(2)
    expect(result.report?.removedExpressions).toBe(1)
  })

  it('unwraps unknown components and drops expression or unknown props', async () => {
    const result = await processMdx('<Evil onClick={x}>kept</Evil>\n\n<Callout type="tip" onClick="x">hi</Callout>')
    // Allowed MDX components stay as JSX nodes (rendered by React), so check text.
    expect(hastToString(result.tree)).toContain('kept')
    expect(result.report?.unwrappedElements).toContain('Evil')
    expect(result.report?.droppedAttributes).toContain('Callout.onClick')
  })

  it('falls back to markdown when MDX cannot be parsed', async () => {
    const result = await html('If x<5 then {broken\n\n## Still renders')
    expect(result.mode).toBe('markdown')
    expect(result.error).toBeTruthy()
    expect(result.html).toContain('Still renders')
  })

  it('never passes raw HTML through in markdown fallback', async () => {
    const result = await html('x<5 <script>alert(1)</script> {')
    expect(result.html).not.toContain('<script>')
  })

  it('demotes headings inside embedded content and collects a TOC', async () => {
    const demoted = await html('## Hint', { headingOffset: 2 })
    expect(demoted.html).toContain('<h4')
    const withToc = await processMdx('## One\n\n### Two\n\n## Three', { toc: true })
    expect(withToc.toc.map((t) => t.text)).toEqual(['One', 'Two', 'Three'])
  })

  it('collects Cloudinary image ids', async () => {
    const result = await processMdx('![Venn diagram](cloudinary:qualifier-hub/maths/venn)')
    expect(result.imageIds).toEqual(['qualifier-hub/maths/venn'])
  })
})
