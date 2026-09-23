/** Terms around the current one (for onboarding and admin pickers). */
export function nearbyTerms(current: string | null, count = 4): string[] {
  const months = ['jan', 'may', 'sep'] as const
  const now = new Date()
  const [yearText, monthText] = (current ?? `${now.getUTCFullYear()}-sep`).split('-')
  let year = Number(yearText)
  let index = Math.max(0, months.indexOf((monthText ?? 'sep') as (typeof months)[number]))
  // Start one term back so students who joined last term can pick it.
  index -= 1
  if (index < 0) {
    index = months.length - 1
    year -= 1
  }
  const terms: string[] = []
  for (let i = 0; i < count; i++) {
    terms.push(`${year}-${months[index]}`)
    index += 1
    if (index >= months.length) {
      index = 0
      year += 1
    }
  }
  return terms
}
