'use client'

import { useMemo, useState } from 'react'

import { evaluateExam, type QualifierRules } from '@/lib/qualifier/rules'
import { cn } from '@/lib/utils/cn'

import { categoryOptions, ScoreInput, Select, Verdict, type CalculatorProgram } from './shared'

export function ScoreCalculator({
  programs,
  rules,
}: {
  programs: CalculatorProgram[]
  rules: QualifierRules
}) {
  const [programSlug, setProgramSlug] = useState(programs[0]?.slug ?? '')
  const [categoryId, setCategoryId] = useState(rules.categories[0]?.id ?? '')
  const [scores, setScores] = useState<Record<string, string>>({})

  const program = programs.find((p) => p.slug === programSlug) ?? programs[0]
  const category = rules.categories.find((c) => c.id === categoryId) ?? rules.categories[0]

  const result = useMemo(() => {
    if (!program || !category) return null
    return evaluateExam(
      program.courses.map((name) => {
        const raw = scores[`${program.slug}:${name}`]
        return { name, score: raw === undefined || raw === '' ? null : Number(raw) }
      }),
      category,
      rules,
    )
  }, [program, category, scores, rules])

  if (!program || !category || !result) return null

  return (
    <div className="my-6 rounded-card bg-surface p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row">
        {programs.length > 1 ? (
          <Select
            label="Programme"
            value={program.slug}
            onChange={setProgramSlug}
            options={programs.map((p) => ({ value: p.slug, label: p.name }))}
          />
        ) : null}
        <Select
          label="Category"
          value={category.id}
          onChange={setCategoryId}
          options={categoryOptions(rules.categories)}
        />
      </div>

      <ul className="mt-5 divide-y divide-border">
        {program.courses.map((course, index) => {
          const row = result.courses[index]
          return (
            <li key={course} className="flex items-center gap-3 py-2">
              <span className="min-w-0 flex-1 text-small font-medium text-text">{course}</span>
              <div className="w-24">
                <ScoreInput
                  label={`${course} qualifier exam score out of 100`}
                  value={scores[`${program.slug}:${course}`] ?? ''}
                  onChange={(value) =>
                    setScores((s) => ({ ...s, [`${program.slug}:${course}`]: value }))
                  }
                />
              </div>
              <span
                className={cn(
                  'w-20 text-right text-xs font-medium',
                  row?.passes ? 'text-success' : 'text-danger',
                )}
              >
                {row?.passes ? 'Clears' : `Needs ${category.course_min}%`}
              </span>
            </li>
          )
        })}
      </ul>

      <p className="mt-3 text-small text-muted">
        Average:{' '}
        <span className="font-semibold text-text tabular-nums">{result.average.toFixed(2)}%</span>{' '}
        (needs {result.averageRequired}%)
      </p>

      <Verdict ok={result.qualified}>
        {result.qualified
          ? `You would qualify${
              result.courseLoad
                ? ` and could register for up to ${result.courseLoad} courses in your first term`
                : ''
            }.`
          : !result.averagePasses
            ? `Your average is below ${result.averageRequired}%.`
            : `Every course needs at least ${category.course_min}%.`}
      </Verdict>
    </div>
  )
}
