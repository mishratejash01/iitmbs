/**
 * Plain-text rendering of MDX/Markdown for meta descriptions, JSON-LD FAQ
 * answers and snippets. Mirrors private.mdx_to_text() in the database.
 */
export function mdxToPlainText(source: string | null | undefined): string {
  if (!source) return ''
  return source
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/\$([^$\n]+)\$/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#*_>`~|\\]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Truncates at a word boundary, adding an ellipsis when shortened. */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:–-]+$/, '')}…`
}
