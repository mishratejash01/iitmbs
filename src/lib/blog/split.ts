const FENCE = /^\s*(```|~~~)/
const H2 = /^##\s+\S/
const QUESTIONS = /^##\s+(?:common questions|frequently asked questions|faqs?)\s*$/i

/**
 * Cuts an article's MDX into three parts at section breaks, so blocks can sit
 * between them: after the first section, and before the "Common questions"
 * section (or the last section). Headings inside code fences are ignored.
 * Short articles give fewer parts; nothing is ever cut mid-section.
 */
export function splitForInserts(mdx: string): { parts: string[]; breaks: number } {
  const lines = mdx.split('\n')
  const headings: number[] = []
  let questions = -1
  let inFence = false
  lines.forEach((line, index) => {
    if (FENCE.test(line)) inFence = !inFence
    if (inFence || !H2.test(line)) return
    headings.push(index)
    if (questions < 0 && QUESTIONS.test(line)) questions = index
  })

  const first = headings[1]
  if (first === undefined) return { parts: [mdx], breaks: 0 }
  const lastSection = headings.at(-1)
  const second = questions > first ? questions : lastSection !== first ? lastSection : undefined

  const cuts = second === undefined ? [first] : [first, second]
  const parts = [0, ...cuts].map((start, i) =>
    lines.slice(start, cuts[i] ?? lines.length).join('\n'),
  )
  return { parts, breaks: cuts.length }
}
