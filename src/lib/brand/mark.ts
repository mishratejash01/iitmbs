/**
 * The brand mark, "your corner": a rounded corner bracket that holds a dot.
 * The dot is the student; the corner is their place in the degree. The eye
 * closes the open square, so the mark reads as whole and settled. Drawn on
 * a 32×32 grid; shared by the site logo, favicon, app icons and share cards.
 */
export const MARK = {
  viewBox: '0 0 32 32',
  radius: 8,
  corner: 'M9 22.5V13a4 4 0 0 1 4-4h9.5',
  stroke: 3.4,
  dot: { cx: 20.5, cy: 20.5, r: 3.4 },
} as const
