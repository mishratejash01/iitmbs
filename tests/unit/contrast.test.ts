import { describe, expect, it } from 'vitest'

import { contrastRatio, findContrastIssues } from '@/lib/theme/contrast'
import { buildThemeCss, defaultTokens, sanitizeThemeOverrides } from '@/lib/theme/tokens'

describe('design tokens', () => {
  it('meet WCAG 2.2 AA contrast', () => {
    expect(findContrastIssues(defaultTokens.light)).toEqual([])
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
    expect(css).toContain('--accent:#0B3A2D')
  })

  it('has a light palette only', () => {
    const css = buildThemeCss({ dark: { bg: '#000000' } } as never)
    expect(css).not.toContain('prefers-color-scheme')
    expect(css).not.toContain('#000000')
  })
})
