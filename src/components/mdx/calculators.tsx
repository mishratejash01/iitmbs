import { EligibilityCalculator as EligibilityCalculatorClient } from '@/components/calculators/eligibility-calculator'
import { ScoreCalculator as ScoreCalculatorClient } from '@/components/calculators/score-calculator'
import type { CalculatorProgram } from '@/components/calculators/shared'
import { getPrograms, getProgramPage } from '@/lib/data/programs'
import { getSiteSettings } from '@/lib/data/settings'
import type { QualifierRules } from '@/lib/qualifier/rules'

async function loadCalculatorData(): Promise<{
  programs: CalculatorProgram[]
  rules: QualifierRules
} | null> {
  const [settings, programs] = await Promise.all([getSiteSettings(), getPrograms()])
  const rules = settings.qualifier
  if (rules.categories.length === 0) return null

  const pages = await Promise.all(programs.map((p) => getProgramPage(p.slug)))
  const calculatorPrograms = pages.flatMap((page) =>
    page && page.courses.length > 0
      ? [
          {
            slug: page.program.slug,
            name: page.program.shortName,
            courses: page.courses.map((c) => c.shortName),
          },
        ]
      : [],
  )
  return calculatorPrograms.length > 0 ? { programs: calculatorPrograms, rules } : null
}

export async function EligibilityCalculator() {
  const data = await loadCalculatorData()
  return data ? <EligibilityCalculatorClient programs={data.programs} rules={data.rules} /> : null
}

export async function ScoreCalculator() {
  const data = await loadCalculatorData()
  return data ? <ScoreCalculatorClient programs={data.programs} rules={data.rules} /> : null
}
