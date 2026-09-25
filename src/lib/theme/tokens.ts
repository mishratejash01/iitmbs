/**
 * Design tokens. These defaults are the palette; an admin can override any
 * token from `site_settings.theme` in the database. The resolved tokens are
 * emitted as CSS custom properties by the root layout, and every colour in the
 * UI reads from them (Tailwind's default palette is disabled in globals.css).
 *
 * The site is light only, built from three colours: deep green (text, buttons,
 * the hero and footer bands), soft lavender (panels and page headers) and white
 * (the page). Five bright highlights (lime, violet, sky, sun, green) are used
 * for the homepage shapes, badges and illustrations, never for body text.
 * Status colours are muted and used only for messages.
 *
 * Contrast notes (WCAG 2.2, checked in tests/unit/contrast.test.ts):
 * - `accent-ink` is the text-safe green (≥ 6:1 on bg, surface and accent-soft).
 * - Highlights carry only `text` or `accent-strong` on top (≥ 7:1).
 * - `accent-strong` is the filled-button and band background; `on-accent` text on it is ≥ 11:1.
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
  'lime',
  'violet',
  'sky',
  'sun',
  'green',
] as const

export type TokenName = (typeof TOKEN_NAMES)[number]
export type ThemeTokens = Record<TokenName, string>
export type ColorScheme = 'light'
export type ThemeOverrides = Partial<Record<ColorScheme, Partial<ThemeTokens>>>

export const defaultTokens: Record<ColorScheme, ThemeTokens> = {
  light: {
    bg: '#FFFFFF',
    surface: '#F3F7F4',
    card: '#FFFFFF',
    border: '#E1E8E3',
    'border-strong': '#C5D1CA',
    text: '#0D231D',
    'text-muted': '#4A5A55',
    accent: '#0B3A2D',
    'accent-soft': '#ECE6FF',
    'accent-hover': '#072A20',
    'accent-strong': '#0B3A2D',
    'accent-ink': '#0B6143',
    'on-accent': '#FFFFFF',
    focus: '#0B6143',
    success: '#2B6048',
    'success-soft': '#E6EFE9',
    warning: '#74501A',
    'warning-soft': '#F7EDDC',
    danger: '#973226',
    'danger-soft': '#F8E5E1',
    lime: '#D4F66A',
    violet: '#C4B2FF',
    sky: '#9FD0FF',
    sun: '#FFC94A',
    green: '#35C46B',
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
  const candidate = (input as Record<string, unknown>).light
  if (!candidate || typeof candidate !== 'object') return {}
  const tokens: Partial<ThemeTokens> = {}
  for (const name of TOKEN_NAMES) {
    const value = (candidate as Record<string, unknown>)[name]
    if (typeof value === 'string' && HEX_COLOR.test(value.trim())) {
      tokens[name] = value.trim()
    }
  }
  return Object.keys(tokens).length > 0 ? { light: tokens } : {}
}

export function resolveTokens(overrides: ThemeOverrides = {}): Record<ColorScheme, ThemeTokens> {
  return { light: { ...defaultTokens.light, ...overrides.light } }
}

function declarations(tokens: ThemeTokens): string {
  return TOKEN_NAMES.map((name) => `--${name}:${tokens[name]}`).join(';')
}

/** Builds the CSS that defines every token. The site has one, light, colour scheme. */
export function buildThemeCss(overrides: ThemeOverrides = {}): string {
  const { light } = resolveTokens(sanitizeThemeOverrides(overrides))
  return `:root{color-scheme:light;${declarations(light)}}`
}
