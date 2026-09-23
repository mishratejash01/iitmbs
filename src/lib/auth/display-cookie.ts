/**
 * A small, non-sensitive cookie that lets static pages show "signed in as …"
 * without loading supabase-js or making the page dynamic. It holds only a
 * display name, avatar URL and whether to show the admin link; every real
 * authorisation decision uses the Supabase session.
 */
export const DISPLAY_COOKIE = 'qh_user'

export type DisplayUser = { name: string; avatar: string | null; staff: boolean }

export function encodeDisplayUser(user: DisplayUser): string {
  return JSON.stringify({ n: user.name.slice(0, 60), a: user.avatar?.slice(0, 500) ?? null, s: user.staff ? 1 : 0 })
}

export function decodeDisplayUser(value: string | null | undefined): DisplayUser | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(value) as { n?: unknown; a?: unknown; s?: unknown }
    if (typeof parsed.n !== 'string') return null
    const avatar = typeof parsed.a === 'string' && /^https:\/\//.test(parsed.a) ? parsed.a : null
    return { name: parsed.n, avatar, staff: parsed.s === 1 }
  } catch {
    return null
  }
}
