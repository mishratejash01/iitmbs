/**
 * Design tokens. These defaults are the fallback palette; an admin can override
 * any token per colour scheme from `site_settings.theme` in the database. The
 * resolved tokens are emitted as CSS custom properties by the root layout, and
 * every colour in the UI reads from them (Tailwind's default palette is
 * disabled in globals.css).
 *
 * Contrast notes (WCAG 2.2, checked in tests/unit/contrast.test.ts):
 * - `accent` (#E8792B) is 2.9:1 on white, so it is used for decoration only.
 * - `accent-ink` is the text-safe orange (≥ 5:1 on bg, surface and accent-soft).
 * - `accent-strong` is the filled-button background; `on-accent` text on it is ≥ 4.5:1.
 * - `focus` rings are ≥ 3:1 against `bg`.
 */

export const TOKEN_NAMES = [
  'bg',
  'surface',
  'card',
  'border',
  'border-strong',
  'text',
  'text-muted',
  'accent',
  'accent-soft',
  'accent-hover',
  'accent-strong',
  'accent-ink',
  'on-accent',
  'focus',
  'success',
  'success-soft',
  'warning',
  'warning-soft',
  'danger',
  'danger-soft',
] as const

export type TokenName = (typeof TOKEN_NAMES)[number]
export type ThemeTokens = Record<TokenName, string>
export type ColorScheme = 'light' | 'dark'
export type ThemeOverrides = Partial<Record<ColorScheme, Partial<ThemeTokens>>>

export const defaultTokens: Record<ColorScheme, ThemeTokens> = {
  light: {
    bg: '#FFFFFF',
    surface: '#FFF8F2',
    card: '#FFFFFF',
    border: '#F1E4D8',
    'border-strong': '#E3CDB9',
    text: '#1F1F1F',
    'text-muted': '#6B6B6B',
    accent: '#E8792B',
    'accent-soft': '#FCEBDD',
    'accent-hover': '#CF6720',
    'accent-strong': '#B4531A',
    'accent-ink': '#9A4413',
    'on-accent': '#FFFFFF',
    focus: '#CF6720',
    success: '#1E7A46',
    'success-soft': '#E7F4EC',
    warning: '#8A5A00',
    'warning-soft': '#FDF3DC',
    danger: '#B42318',
    'danger-soft': '#FDECEA',
  },
  dark: {
    bg: '#141110',
    surface: '#1C1816',
    card: '#201B18',
    border: '#322A25',
    'border-strong': '#463A33',
    text: '#F4EFEA',
    'text-muted': '#B3A89E',
    accent: '#F08A3E',
    'accent-soft': '#3A2415',
    'accent-hover': '#F59B57',
    'accent-strong': '#F08A3E',
    'accent-ink': '#F5A365',
    'on-accent': '#1A0F07',
    focus: '#F59B57',
    success: '#5CC98A',
    'success-soft': '#16301F',
    warning: '#E8B44C',
    'warning-soft': '#33280F',
    danger: '#F2837A',
    'danger-soft': '#3A1A17',
  },
}

const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i

/**
 * Validates untrusted overrides (they come from the database). Only known token
 * names with plain hex colour values survive, which also rules out CSS
 * injection through the inline <style> tag.
 */
export function sanitizeThemeOverrides(input: unknown): ThemeOverrides {
  if (!input || typeof input !== 'object') return {}
  const result: ThemeOverrides = {}
  for (const scheme of ['light', 'dark'] as const) {
    const candidate = (input as Record<string, unknown>)[scheme]
    if (!candidate || typeof candidate !== 'object') continue
    const tokens: Partial<ThemeTokens> = {}
    for (const name of TOKEN_NAMES) {
      const value = (candidate as Record<string, unknown>)[name]
      if (typeof value === 'string' && HEX_COLOR.test(value.trim())) {
        tokens[name] = value.trim()
      }
    }
    if (Object.keys(tokens).length > 0) result[scheme] = tokens
  }
  return result
}

export function resolveTokens(overrides: ThemeOverrides = {}): Record<ColorScheme, ThemeTokens> {
  return {
    light: { ...defaultTokens.light, ...overrides.light },
    dark: { ...defaultTokens.dark, ...overrides.dark },
  }
}

function declarations(tokens: ThemeTokens): string {
  return TOKEN_NAMES.map((name) => `--${name}:${tokens[name]}`).join(';')
}

/**
 * Builds the CSS that defines every token for both colour schemes. Dark tokens
 * apply when the visitor chose dark explicitly (`data-theme="dark"` on <html>)
 * or when their OS prefers dark and they have not forced light.
 */
export function buildThemeCss(
  overrides: ThemeOverrides = {},
  options: { dark?: boolean } = {},
): string {
  const { light, dark } = resolveTokens(sanitizeThemeOverrides(overrides))
  const lightBlock = `:root{color-scheme:light;${declarations(light)}}`
  // With dark mode switched off in settings, only the light palette exists.
  if (options.dark === false) return lightBlock
  const darkBlock = `color-scheme:dark;${declarations(dark)}`
  return [
    lightBlock,
    `:root[data-theme=dark]{${darkBlock}}`,
    `@media (prefers-color-scheme:dark){:root:not([data-theme=light]){${darkBlock}}}`,
  ].join('')
}
