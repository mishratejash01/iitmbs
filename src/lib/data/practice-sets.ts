import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'

import { tableTag } from '@/lib/cache/tags'
import { getPublicClient } from '@/lib/supabase/public'

import { fetchQuestions } from './questions'
import { contentCacheProfile } from './settings'
import type { Question } from './types'

export type PracticeSet = {
  id: string
  title: string
  summary: string | null
  introMdx: string | null
  term: string
  released: boolean
  questions: Question[]
}

/** Course-level practice sets (e.g. qualifier exam practice) with questions. */
export async function getAssignmentSets(ids: string[]): Promise<PracticeSet[]> {
  'use cache'
  cacheLife(await contentCacheProfile())
  cacheTag(tableTag('assignments'), tableTag('questions'))

  if (ids.length === 0) return []
  const { data, error } = await getPublicClient()
    .from('assignments')
    .select('id, title, summary, intro_mdx, term, solutions_release_at, published_at')
    .in('id', [...ids].sort())
    .order('published_at')

  if (error) {
    console.error('[data/practice-sets] fetch failed:', error.message)
    return []
  }

  const now = Date.now()
  return Promise.all(
    data.map(async (row) => ({
      id: row.id,
      title: row.title,
      summary: row.summary,
      introMdx: row.intro_mdx,
      term: row.term,
      released: Date.parse(row.solutions_release_at) <= now,
      questions: await fetchQuestions(row.id),
    })),
  )
}
