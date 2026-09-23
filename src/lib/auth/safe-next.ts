/**
 * Only same-site relative paths are allowed as post-login destinations
 * (prevents open redirects such as ?next=//evil.example).
 */
export function safeNextPath(value: string | null | undefined, fallback = '/dashboard'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\'))
    return fallback
  if (/^\/(auth|api)\//.test(value) || value === '/login') return fallback
  return value.slice(0, 500)
}
