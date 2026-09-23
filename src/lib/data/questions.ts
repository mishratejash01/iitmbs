import 'server-only'

import type { Database } from '@/lib/supabase/database.types'
import { getPublicClient } from '@/lib/supabase/public'

import { isJsonObject } from './mappers'
import type { AnswerKey, Question, QuestionOption } from './types'

type QuestionRow = Database['public']['Functions']['get_assignment_questions']['Returns'][number]

function toOptions(value: unknown): QuestionOption[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((option) =>
    option && typeof option === 'object' && typeof option.id === 'string'
      ? [{ id: option.id, labelMdx: typeof option.label_mdx === 'string' ? option.label_mdx : '' }]
      : [],
  )
}

function toAnswerKey(value: unknown): AnswerKey | null {
  if (!value || typeof value !== 'object') return null
  const key = value as Record<string, unknown>
  if (Array.isArray(key.correct)) return { correct: key.correct.map(String) }
  if (typeof key.value === 'number') {
    return { value: key.value, tolerance: typeof key.tolerance === 'number' ? key.tolerance : undefined }
  }
  if (Array.isArray(key.accepted)) return { accepted: key.accepted.map(String) }
  return null
}

export function toQuestion(row: QuestionRow): Question {
  return {
    id: row.id,
    position: row.position,
    type: row.question_type,
    questionMdx: row.question_mdx,
    options: toOptions(row.options),
    hintMdx: row.hint_mdx,
    conceptTags: row.concept_tags ?? [],
    difficulty: row.difficulty,
    marks: row.marks,
    answerMdx: row.answer_mdx,
    explanationMdx: row.explanation_mdx,
    answerKey: isJsonObject(row.answer_key) ? toAnswerKey(row.answer_key) : null,
  }
}

/**
 * Questions of a live assignment through the gated RPC. Answers,
 * explanations and answer keys are null until the release time — the gate is
 * enforced by Postgres, not here.
 */
export async function fetchQuestions(assignmentId: string): Promise<Question[]> {
  const { data, error } = await getPublicClient().rpc('get_assignment_questions', {
    p_assignment_id: assignmentId,
  })
  if (error) {
    console.error('[data/questions] fetch failed:', error.message)
    return []
  }
  return data.map(toQuestion)
}
