'use client'

import { useMemo, useState } from 'react'

import { courseResult, marksNeeded, PASS_MARK } from '@/lib/grades/calculate'
import { GRADE_COURSES, GRADING_TERM } from '@/lib/grades/courses'
import type { GradeComponent, GradeCourse } from '@/lib/grades/types'
import { cn } from '@/lib/utils/cn'

import { ScoreInput, Select, Verdict } from './shared'

const PROGRAMS = [
  { value: 'ds', label: 'Data Science' },
  { value: 'es', label: 'Electronic Systems' },
] as const

const LEVELS: Record<GradeCourse['level'], string> = {
  foundation: 'Foundation',
  diploma: 'Diploma',
  degree: 'Degree',
}

const LEVEL_ORDER: GradeCourse['level'][] = ['foundation', 'diploma', 'degree']

const toNumber = (raw: string | undefined) => {
  const value = Number(raw)
  return raw === undefined || raw === '' || Number.isNaN(value) ? 0 : value
}

const format = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(1))

function ScoreRow({
  component,
  value,
  onChange,
}: {
  component: GradeComponent
  value: string
  onChange: (value: string) => void
}) {
  return (
    <li className="flex items-center gap-3 py-2">
      <span className="min-w-0 flex-1 text-small font-medium text-text">{component.label}</span>
      <div className="w-24">
        <ScoreInput
          label={`${component.label} score out of ${component.max}`}
          value={value}
          onChange={onChange}
          max={component.max}
        />
      </div>
      <span className="w-16 text-xs text-muted">/ {component.max}</span>
    </li>
  )
}

/**
 * IITM BS course grade calculator: pick a course, enter the scores so far and
 * see the end term marks needed for each grade, or the grade for a full set.
 */
export function GradeCalculator() {
  const [program, setProgram] = useState<GradeCourse['program']>('ds')
  const courses = useMemo(
    () =>
      GRADE_COURSES.filter((course) => course.program === program).sort(
        (a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level),
      ),
    [program],
  )
  const [courseId, setCourseId] = useState(courses[0]?.id ?? '')
  const [scores, setScores] = useState<Record<string, string>>({})

  const course = courses.find((c) => c.id === courseId) ?? courses[0]
  if (!course) return null

  const field = (key: string) => scores[`${course.id}:${key}`] ?? ''
  const setField = (key: string) => (value: string) =>
    setScores((s) => ({ ...s, [`${course.id}:${key}`]: value }))

  const values = Object.fromEntries(
    course.components.map((c) => [c.key, toNumber(scores[`${course.id}:${c.key}`])]),
  )
  const bonus = toNumber(scores[`${course.id}:bonus`])
  const needed = marksNeeded(course, values, bonus)
  const finalRaw = course.final ? field(course.final.key) : ''
  const result =
    !course.final || finalRaw !== ''
      ? courseResult(
          course,
          course.final ? { ...values, [course.final.key]: toNumber(finalRaw) } : values,
          bonus,
        )
      : null

  return (
    <div className="my-6 rounded-card bg-surface p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Select
          label="Programme"
          value={program}
          onChange={(value) => {
            const next = value as GradeCourse['program']
            setProgram(next)
            setCourseId(GRADE_COURSES.find((c) => c.program === next)?.id ?? '')
          }}
          options={PROGRAMS.map((p) => ({ value: p.value, label: p.label }))}
        />
        <Select
          label="Course"
          value={course.id}
          onChange={setCourseId}
          options={courses.map((c) => ({
            value: c.id,
            label: `${c.name} (${LEVELS[c.level]})`,
          }))}
        />
      </div>

      <h3 className="mt-6 text-small font-semibold text-text">Your scores so far</h3>
      <p className="text-xs text-muted">
        Leave a box empty if you have not taken it yet: it counts as 0.
      </p>
      <ul className="mt-1 divide-y divide-border">
        {course.components.map((component) => (
          <ScoreRow
            key={component.key}
            component={component}
            value={field(component.key)}
            onChange={setField(component.key)}
          />
        ))}
        {course.bonusMax > 0 ? (
          <ScoreRow
            component={{
              key: 'bonus',
              label: 'Bonus marks (counted only if you pass)',
              max: course.bonusMax,
            }}
            value={field('bonus')}
            onChange={setField('bonus')}
          />
        ) : null}
      </ul>

      {course.final ? (
        <>
          <h3 className="mt-6 text-small font-semibold text-text">
            End term marks you need (out of {course.final.max})
          </h3>
          <table className="mt-2 w-full text-small">
            <tbody className="divide-y divide-border">
              {needed.map((row) => (
                <tr key={row.letter}>
                  <th scope="row" className="w-16 py-2 text-left font-semibold text-text">
                    {row.letter}
                  </th>
                  <td
                    className={cn(
                      'py-2 text-right tabular-nums',
                      row.needed === null ? 'text-muted' : 'font-medium text-text',
                    )}
                  >
                    {row.needed === null
                      ? 'Not possible'
                      : row.needed === 0
                        ? 'Already secured'
                        : format(row.needed)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <ul className="mt-4 divide-y divide-border border-t border-border">
            <ScoreRow
              component={{ ...course.final, label: 'Already have your end term score?' }}
              value={finalRaw}
              onChange={setField(course.final.key)}
            />
          </ul>
        </>
      ) : null}

      {result ? (
        <Verdict ok={result.passed}>
          {result.passed
            ? `Total course score ${format(result.total)}: grade ${result.grade}.`
            : result.unmet.length > 0
              ? `Not passed yet: ${result.unmet.join('; ')}.`
              : `Total course score ${format(result.base)}: you need ${PASS_MARK} to pass.`}
        </Verdict>
      ) : null}

      <div className="mt-5 space-y-1 text-xs text-muted">
        <p>
          <span className="font-medium text-text">Formula:</span> {course.display}
        </p>
        {course.notes.map((note) => (
          <p key={note}>{note}</p>
        ))}
        <p>
          From the {GRADING_TERM} {course.program === 'ds' ? 'Data Science' : 'Electronic Systems'}{' '}
          grading document. Check your own term&apos;s grading document on the student portal.
        </p>
      </div>
    </div>
  )
}
