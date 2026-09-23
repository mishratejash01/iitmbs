/**
 * Domain types returned by the data layer. Pages and components depend on
 * these, never on raw database rows, so the schema can evolve behind them.
 * Every value is plain JSON so results can be cached with 'use cache'.
 */

import type { Json } from '@/lib/supabase/database.types'

export type SeoFields = {
  seoTitle: string | null
  seoDescription: string | null
  ogImagePublicId: string | null
  canonicalPath: string | null
  noindex: boolean
  keywords: string[]
  schemaOverrides: Record<string, Json | undefined>
}

export type ProgramRef = {
  id: string
  slug: string
  name: string
  shortName: string
  path: string
}

export type CourseRef = {
  id: string
  slug: string
  name: string
  shortName: string
  code: string | null
  aliases: string[]
  path: string
  program: ProgramRef
}

export type AuthorRef = {
  id: string
  slug: string
  name: string
  headline: string | null
  credentials: string | null
  avatarPublicId: string | null
  sameAs: string[]
}

export type Faq = {
  id: string
  question: string
  answerMdx: string
}

export type ResourceItem = {
  id: string
  kind: 'pdf' | 'sheet' | 'link' | 'video'
  title: string
  description: string | null
  requiresLogin: boolean
  fileFormat: string | null
  fileBytes: number | null
  isExternal: boolean
  host: string | null
  downloadCount: number
}

export type NoteKind = 'week' | 'topic' | 'formula_sheet' | 'exam_prep'

export type NoteSummary = {
  id: string
  slug: string
  kind: NoteKind
  title: string
  summary: string | null
  readingTimeMinutes: number
  weekNumber: number | null
  path: string
  updatedAt: string
}

export type AssignmentType = 'graded' | 'practice' | 'activity'

export type AssignmentSummary = {
  id: string
  type: AssignmentType
  term: string
  title: string
  summary: string | null
  dueAt: string | null
  solutionsReleaseAt: string
  /** Whether solutions were released when this data was cached. */
  released: boolean
  weekNumber: number | null
  isLatest: boolean
  path: string | null
  updatedAt: string
}

export type WeekSummary = {
  id: string
  number: number
  title: string
  summary: string | null
  topics: string[]
  path: string
  hasContent: boolean
  hasGraded: boolean
  hasPractice: boolean
  hasNotes: boolean
}

export type QuestionOption = { id: string; labelMdx: string }

export type AnswerKey =
  | { correct: string[] }
  | { value: number; tolerance?: number }
  | { accepted: string[] }

export type Question = {
  id: string
  position: number
  type: 'mcq' | 'msq' | 'numeric' | 'text'
  questionMdx: string
  options: QuestionOption[]
  hintMdx: string | null
  conceptTags: string[]
  difficulty: 'easy' | 'medium' | 'hard' | null
  marks: number | null
  /** Null until solutions are released (enforced in Postgres). */
  answerMdx: string | null
  explanationMdx: string | null
  answerKey: AnswerKey | null
}

export type LinkIndexEntry = {
  path: string
  title: string
  summary: string | null
  kind: 'program' | 'course' | 'week' | 'assignment' | 'note' | 'page'
}
