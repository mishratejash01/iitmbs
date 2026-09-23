export type TemplateVars = Record<string, string | number | null | undefined>

/**
 * Fills "{name}" placeholders from the site-settings SEO templates. Returns
 * the fallback when there is no template or a placeholder has no value, so a
 * half-filled title never reaches search results.
 */
export function fillTemplate(
  template: string | null | undefined,
  vars: TemplateVars,
  fallback: string,
): string {
  if (!template) return fallback
  let missing = false
  const filled = template.replace(/\{([a-z_]+)\}/g, (_, key: string) => {
    const value = vars[key]
    if (value === null || value === undefined || value === '') {
      missing = true
      return ''
    }
    return String(value)
  })
  return missing ? fallback : filled.replace(/\s+/g, ' ').trim()
}
