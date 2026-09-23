/**
 * What MDX stored in the database is allowed to contain.
 *
 * Content is authored by editors in the admin, but it is still treated as
 * untrusted input: no imports/exports, no JavaScript expressions, only the
 * components and HTML elements listed here, and only string/boolean props.
 * Anything else is removed by the sanitiser before rendering.
 */

/** Custom components available to authors, with the props each accepts. */
export const ALLOWED_COMPONENTS: Record<string, readonly string[]> = {
  Callout: ['type', 'title'],
  RelatedLink: ['href', 'title'],
  SiteName: [],
  ContactEmail: [],
  ContactLink: [],
  SyllabusOverview: ['program'],
  EligibilityCalculator: [],
  ScoreCalculator: [],
  Figure: ['src', 'alt', 'caption', 'width', 'height'],
  YouTube: ['id', 'title', 'start'],
  KeyIdea: ['title'],
  Steps: [],
  Definition: ['term'],
}

/** Plain HTML elements authors may use inline, with their allowed attributes. */
export const ALLOWED_HTML: Record<string, readonly string[]> = {
  sup: [],
  sub: [],
  br: [],
  kbd: [],
  abbr: ['title'],
  mark: [],
  small: [],
  u: [],
  s: [],
  del: [],
  ins: [],
  details: ['open'],
  summary: [],
}

export function isAllowedElement(name: string | null | undefined): name is string {
  return Boolean(name && (name in ALLOWED_COMPONENTS || name in ALLOWED_HTML))
}

export function allowedAttributes(name: string): readonly string[] {
  return ALLOWED_COMPONENTS[name] ?? ALLOWED_HTML[name] ?? []
}
