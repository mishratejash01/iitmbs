import type { ThemeTokens, TokenName } from './tokens'

/** WCAG 2.2 relative luminance of a #rgb / #rrggbb colour. */
export function relativeLuminance(hex: string): number {
  let value = hex.replace('#', '')
  if (value.length === 3) {
    value = [...value].map((char) => char + char).join('')
  }
  const channels = [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16) / 255)
  const [r, g, b] = channels.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0)
}

/** WCAG contrast ratio between two colours, from 1 to 21. */
export function contrastRatio(foreground: string, background: string): number {
  const a = relativeLuminance(foreground)
  const b = relativeLuminance(background)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

/**
 * Token pairs the UI actually renders, with the minimum ratio each must meet:
 * 4.5 for body-size text, 3 for focus indicators and other UI graphics.
 */
export const REQUIRED_CONTRAST: ReadonlyArray<[TokenName, TokenName, number]> = [
  ['text', 'bg', 4.5],
  ['text', 'surface', 4.5],
  ['text', 'accent-soft', 4.5],
  ['text-muted', 'bg', 4.5],
  ['text-muted', 'surface', 4.5],
  ['text-muted', 'card', 4.5],
  ['accent-ink', 'bg', 4.5],
  ['accent-ink', 'surface', 4.5],
  ['accent-ink', 'accent-soft', 4.5],
  ['on-accent', 'accent-strong', 4.5],
  ['focus', 'bg', 3],
  ['focus', 'surface', 3],
  ['success', 'success-soft', 4.5],
  ['warning', 'warning-soft', 4.5],
  ['danger', 'danger-soft', 4.5],
  ['danger', 'bg', 4.5],
  // Highlight shapes and badges on the homepage carry dark text or the band green.
  ['text', 'lime', 4.5],
  ['text', 'violet', 4.5],
  ['text', 'sky', 4.5],
  ['text', 'sun', 4.5],
  ['text', 'green', 4.5],
  ['accent-strong', 'lime', 4.5],
]

export type ContrastIssue = {
  foreground: TokenName
  background: TokenName
  ratio: number
  required: number
}

/** Lists every required pair that fails for a resolved token set. */
export function findContrastIssues(tokens: ThemeTokens): ContrastIssue[] {
  return REQUIRED_CONTRAST.flatMap(([foreground, background, required]) => {
    const ratio = contrastRatio(tokens[foreground], tokens[background])
    return ratio < required ? [{ foreground, background, ratio, required }] : []
  })
}
