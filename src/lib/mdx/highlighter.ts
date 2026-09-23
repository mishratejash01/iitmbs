import 'server-only'

import { createHighlighter, type Highlighter } from 'shiki'

/** Languages authors are likely to use in qualifier content. */
export const CODE_LANGUAGES = [
  'python',
  'c',
  'cpp',
  'java',
  'javascript',
  'typescript',
  'sql',
  'bash',
  'json',
  'markdown',
  'latex',
  'text',
] as const

export const CODE_THEMES = { light: 'github-light', dark: 'github-dark' } as const

let highlighter: Promise<Highlighter> | undefined

/** One highlighter per server process; creating it is the expensive part. */
export function getHighlighter(): Promise<Highlighter> {
  highlighter ??= createHighlighter({
    themes: [CODE_THEMES.light, CODE_THEMES.dark],
    langs: [...CODE_LANGUAGES],
  })
  return highlighter
}
