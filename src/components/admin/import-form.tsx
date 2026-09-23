'use client'

import { startTransition, useActionState, useState } from 'react'

import { importRows, type ImportState } from '@/app/admin/actions'
import { Button } from '@/components/ui/button'
import type { FieldOption } from '@/lib/admin/fields'

import { ReferenceSelect } from './structured-fields'
import { inputClasses } from './ui'

const EXAMPLES = {
  questions: {
    csv: `position,question_type,question_mdx,options,hint_mdx,answer_key,explanation_mdx,source_permission
1,mcq,"What is $2 + 3$?","4|5|6","Add the numbers.","{""correct"":[""b""]}","$2 + 3 = 5$.",original
2,numeric,"Evaluate $\\int_0^1 2x\\,dx$.",,"Use the power rule.","{""value"":1,""tolerance"":0.01}","$[x^2]_0^1 = 1$.",original`,
    help: 'Columns: position, question_type (mcq, msq, numeric, text), question_mdx, options (a|b|c or JSON), hint_mdx, answer_mdx, explanation_mdx, answer_key (JSON), concept_tags (a;b), difficulty (easy, medium, hard), marks, source_permission (original, permission_granted, official_link), source_url.',
  },
  weeks: {
    csv: `week_number,title,summary,topics,source_permission
1,Set theory and relations,"Sets, subsets and relations.","Sets;Relations;Functions",official_link`,
    help: 'Columns: week_number (1–16), title, summary, topics (separated by ; or |), source_permission.',
  },
} as const

type Kind = keyof typeof EXAMPLES

export function ImportForm({
  assignments,
  courses,
  initialKind,
  initialTarget,
}: {
  assignments: FieldOption[]
  courses: FieldOption[]
  initialKind: Kind
  initialTarget: string
}) {
  const [state, action, pending] = useActionState(importRows, { status: 'idle' } as ImportState)
  const [kind, setKind] = useState<Kind>(initialKind)
  const example = EXAMPLES[kind]

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        // Manual submit keeps the pasted data if some rows have errors.
        const data = new FormData(event.currentTarget)
        startTransition(() => action(data))
      }}
      className="max-w-4xl space-y-5 rounded-card border border-border bg-card p-4 sm:p-5"
    >
      <div className="grid gap-4 sm:grid-cols-[14rem_1fr]">
        <div>
          <label htmlFor="import-kind" className="mb-1.5 block text-small font-medium text-text">
            Import
          </label>
          <select
            id="import-kind"
            name="kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as Kind)}
            className={inputClasses}
          >
            <option value="questions">Questions into an assignment</option>
            <option value="weeks">Weeks into a course</option>
          </select>
        </div>
        <div>
          <label htmlFor="import-target" className="mb-1.5 block text-small font-medium text-text">
            {kind === 'questions' ? 'Assignment' : 'Course'}
          </label>
          <ReferenceSelect
            key={kind}
            id="import-target"
            name="target_id"
            defaultValue={initialKind === kind ? initialTarget : ''}
            options={kind === 'questions' ? assignments : courses}
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="import-data" className="mb-1.5 block text-small font-medium text-text">
          CSV or JSON
        </label>
        <textarea
          id="import-data"
          name="data"
          rows={14}
          spellCheck={false}
          placeholder={example.csv}
          aria-describedby="import-help"
          className={`${inputClasses} py-2 font-mono text-small`}
        />
        <p id="import-help" className="mt-1 text-xs text-muted">
          {example.help} The first row must be the column names. JSON must be an array of objects
          with the same keys. Nothing is imported if any row has an error. Imported weeks start as
          drafts; questions show on the assignment page as soon as it is live.
        </p>
      </div>

      {state.status === 'done' ? (
        <p
          role="status"
          className="rounded-control bg-success-soft px-4 py-3 text-small text-success"
        >
          {state.message}
        </p>
      ) : null}
      {state.status === 'error' ? (
        <div
          role="alert"
          className="rounded-control bg-danger-soft px-4 py-3 text-small text-danger"
        >
          <p className="font-medium">{state.message}</p>
          {state.rowErrors?.length ? (
            <ul className="mt-1 list-disc pl-5">
              {state.rowErrors.slice(0, 20).map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? 'Importing…' : 'Import'}
      </Button>
    </form>
  )
}
