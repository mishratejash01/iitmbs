import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'

import { tableTag } from '@/lib/cache/tags'
import { isPyqExam, PYQ_EXAMS, pyqCoursePath, termSortKey, type PyqExam } from '@/lib/routes'
import { getPublicClient } from '@/lib/supabase/public'

import { contentCacheProfile } from './settings'
import type { NoteLevel } from './student-notes'

export type PyqCourse = {
  id: string
  code: string
  slug: string
  path: string
  name: string
  shortName: string
  level: NoteLevel
  programSlug: string | null
  courseId: string | null
  blogPostId: string | null
  paperCount: number
  /** Exams with at least one paper, in exam order. */
  exams: PyqExam[]
  examCounts: Partial<Record<PyqExam, number>>
  /** Terms with at least one paper, newest first. */
  terms: string[]
  updatedAt: string
}

export type QuestionPaper = {
  id: string
  exam: PyqExam
  term: string
  session: 'fn' | 'an' | null
  examDate: string | null
  variant: number
  url: string
  fileName: string | null
  pageFrom: number | null
  pageTo: number | null
  questionCount: number | null
  hasAnswers: boolean
  contributor: string | null
  /** e.g. "re-attempt". */
  note: string | null
}

const byTermDesc = (a: string, b: string) => termSortKey(b) - termSortKey(a)

const PAGE_SIZE = 1000

/** Every live paper's course, exam and term. The API returns at most 1000 rows a request, so this pages. */
async function allPaperRows() {
  const db = getPublicClient()
  const rows: Array<{ note_course_id: string; exam: string; term: string; updated_at: string }> = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await db
      .from('question_papers')
      .select('note_course_id, exam, term, updated_at')
      .order('id')
      .range(from, from + PAGE_SIZE - 1)
    if (error) {
      console.error('[data/question-papers] papers failed:', error.message)
      break
    }
    rows.push(...data)
    if (data.length < PAGE_SIZE) break
  }
  return rows
}

/**
 * Every live course with at least one live paper, in display order. RLS hides
 * unpublished rows, so the counts are what visitors can open.
 */
export async function getPyqCourses(): Promise<PyqCourse[]> {
  'use cache'
  cacheLife(await contentCacheProfile())
  cacheTag(tableTag('note_courses'), tableTag('question_papers'), tableTag('programs'))

  const db = getPublicClient()
  const [courses, papers] = await Promise.all([
    db
      .from('note_courses')
      .select(
        'id, code, slug, name, short_name, level, course_id, blog_post_id, updated_at, program:programs(slug)',
      )
      .order('sort_order')
      .order('name'),
    allPaperRows(),
  ])
  if (courses.error) {
    console.error('[data/question-papers] courses failed:', courses.error.message)
    return []
  }

  const stats = new Map<
    string,
    { count: number; exams: Map<string, number>; terms: Set<string>; updated: string }
  >()
  for (const row of papers) {
    const entry = stats.get(row.note_course_id) ?? {
      count: 0,
      exams: new Map<string, number>(),
      terms: new Set<string>(),
      updated: row.updated_at,
    }
    entry.count += 1
    entry.exams.set(row.exam, (entry.exams.get(row.exam) ?? 0) + 1)
    entry.terms.add(row.term)
    if (row.updated_at > entry.updated) entry.updated = row.updated_at
    stats.set(row.note_course_id, entry)
  }

  return courses.data.flatMap((row) => {
    const entry = stats.get(row.id)
    if (!entry) return []
    return [
      {
        id: row.id,
        code: row.code,
        slug: row.slug,
        path: pyqCoursePath(row.slug),
        name: row.name,
        shortName: row.short_name,
        level: row.level as NoteLevel,
        programSlug: row.program?.slug ?? null,
        courseId: row.course_id,
        blogPostId: row.blog_post_id,
        paperCount: entry.count,
        exams: PYQ_EXAMS.filter((exam) => entry.exams.has(exam)),
        examCounts: Object.fromEntries(
          PYQ_EXAMS.filter((exam) => entry.exams.has(exam)).map((exam) => [
            exam,
            entry.exams.get(exam) ?? 0,
          ]),
        ),
        terms: [...entry.terms].sort(byTermDesc),
        updatedAt: entry.updated > row.updated_at ? entry.updated : row.updated_at,
      },
    ]
  })
}

/** One course's papers: newest term first, then exam order, newest date, session and set. */
export async function getCoursePapers(noteCourseId: string): Promise<QuestionPaper[]> {
  'use cache'
  cacheLife(await contentCacheProfile())
  cacheTag(tableTag('question_papers'))

  const { data, error } = await getPublicClient()
    .from('question_papers')
    .select(
      'id, exam, term, session, exam_date, variant, url, file_name, page_from, page_to, question_count, has_answers, contributor, note, sort_order',
    )
    .eq('note_course_id', noteCourseId)

  if (error) {
    console.error('[data/question-papers] papers failed:', error.message)
    return []
  }
  const examOrder = (exam: string) => PYQ_EXAMS.indexOf(exam as PyqExam)
  return data
    .filter((row) => isPyqExam(row.exam))
    .sort(
      (a, b) =>
        byTermDesc(a.term, b.term) ||
        examOrder(a.exam) - examOrder(b.exam) ||
        (b.exam_date ?? '').localeCompare(a.exam_date ?? '') ||
        (a.session ?? '').localeCompare(b.session ?? '') ||
        a.variant - b.variant ||
        a.sort_order - b.sort_order,
    )
    .map((row) => ({
      id: row.id,
      exam: row.exam as PyqExam,
      term: row.term,
      session: row.session === 'fn' || row.session === 'an' ? row.session : null,
      examDate: row.exam_date,
      variant: row.variant,
      url: row.url,
      fileName: row.file_name,
      pageFrom: row.page_from,
      pageTo: row.page_to,
      questionCount: row.question_count,
      hasAnswers: row.has_answers,
      contributor: row.contributor,
      note: row.note,
    }))
}
