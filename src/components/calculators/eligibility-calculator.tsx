'use client'

import { useMemo, useState } from 'react'

import { evaluateEligibility, type QualifierRules } from '@/lib/qualifier/rules'
import { cn } from '@/lib/utils/cn'

import { categoryOptions, ScoreInput, Select, Verdict, type CalculatorProgram } from './shared'

export function EligibilityCalculator({
  programs,
  rules,
}: {
  programs: CalculatorProgram[]
  rules: QualifierRules
}) {
  const [programSlug, setProgramSlug] = useState(programs[0]?.slug ?? '')
  const [categoryId, setCategoryId] = useState(rules.categories[0]?.id ?? '')
  const [scores, setScores] = useState<Record<string, string[]>>({})

  const program = programs.find((p) => p.slug === programSlug) ?? programs[0]
  const category = rules.categories.find((c) => c.id === categoryId) ?? rules.categories[0]
  const weeks = rules.ga_rule.first_weeks

  const result = useMemo(() => {
    if (!program || !category) return null
    return evaluateEligibility(
      program.courses.map((name) => ({
        name,
        scores: (scores[`${program.slug}:${name}`] ?? []).map((v) => (v === '' ? null : Number(v))),
      })),
      category,
      rules,
    )
  }, [program, category, scores, rules])

  if (!program || !category || !result) return null

  const setScore = (course: string, week: number, value: string) => {
    const key = `${program.slug}:${course}`
    setScores((current) => {
      const next = [...(current[key] ?? Array.from({ length: weeks }, () => ''))]
      next[week] = value
      return { ...current, [key]: next }
    })
  }

  return (
    <div className="my-6 rounded-card border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row">
        {programs.length > 1 ? (
          <Select
            label="Programme"
            value={program.slug}
            onChange={setProgramSlug}
            options={programs.map((p) => ({ value: p.slug, label: p.name }))}
          />
        ) : null}
        <Select label="Category" value={category.id} onChange={setCategoryId} options={categoryOptions(rules.categories)} />
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[22rem] border-collapse text-small">
          <caption className="sr-only">
            Graded assignment scores for weeks 1 to {weeks}, out of 100
          </caption>
          <thead>
            <tr className="text-left text-muted">
              <th scope="col" className="pb-2 font-medium">Course</th>
              {Array.from({ length: weeks }, (_, w) => (
                <th key={w} scope="col" className="pb-2 text-center font-medium">
                  Week {w + 1}
                </th>
              ))}
              <th scope="col" className="pb-2 text-right font-medium">Best {rules.ga_rule.best_of} avg</th>
            </tr>
          </thead>
          <tbody>
            {program.courses.map((course, index) => {
              const row = result.courses[index]
              return (
                <tr key={course} className="border-t border-border">
                  <th scope="row" className="py-2 pr-2 text-left font-medium text-text">
                    {course}
                  </th>
                  {Array.from({ length: weeks }, (_, w) => (
                    <td key={w} className="px-1 py-2">
                      <ScoreInput
                        label={`${course} week ${w + 1} score out of 100`}
                        value={scores[`${program.slug}:${course}`]?.[w] ?? ''}
                        onChange={(value) => setScore(course, w, value)}
                        className="min-w-14"
                      />
                    </td>
                  ))}
                  <td className="py-2 pl-2 text-right tabular-nums">
                    <span className={cn('font-semibold', row?.passes ? 'text-success' : 'text-danger')}>
                      {row?.average.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Verdict ok={result.eligible}>
        {result.eligible
          ? `You clear the ${category.ga_min}% graded-assignment cut-off in every course.`
          : `Not yet: ${result.courses
              .filter((c) => !c.passes)
              .map((c) => `${c.name} needs ${c.shortfall.toFixed(1)} more percentage points`)
              .join('; ')}.`}
      </Verdict>
    </div>
  )
}
