import { describe, expect, it } from 'vitest'

import { contrastRatio, findContrastIssues } from '@/lib/theme/contrast'
import { buildThemeCss, defaultTokens, sanitizeThemeOverrides } from '@/lib/theme/tokens'

describe('design tokens', () => {
  it('meet WCAG 2.2 AA contrast in light and dark mode', () => {
    expect(findContrastIssues(defaultTokens.light)).toEqual([])
    expect(findContrastIssues(defaultTokens.dark)).toEqual([])
  })

  it('computes known contrast ratios', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0)
    expect(contrastRatio('#E8792B', '#FFFFFF')).toBeLessThan(3)
  })

  it('sanitises untrusted overrides and cannot inject CSS', () => {
    const overrides = sanitizeThemeOverrides({
      light: { accent: '#123456', bg: 'red;}</style><script>', unknown: '#ffffff' },
      dark: 'nope',
    })
    expect(overrides).toEqual({ light: { accent: '#123456' } })
    const css = buildThemeCss({ light: { bg: 'url(javascript:alert(1))' } } as never)
    expect(css).not.toContain('javascript')
    expect(css).toContain('--accent:#E8792B')
  })

  it('omits the dark palette when dark mode is disabled', () => {
    expect(buildThemeCss({}, { dark: false })).not.toContain('prefers-color-scheme')
  })
})
