import type { NoteLevel } from '@/lib/data/student-notes'

export const NEWSLETTER_SEGMENTS = [
  'qualifier',
  'foundation',
  'diploma',
  'degree',
  'general',
] as const
export type NewsletterSegment = (typeof NEWSLETTER_SEGMENTS)[number]

// Topics whose readers are mostly getting into the degree.
const QUALIFIER_TOPICS = new Set(['admissions', 'exam-dates'])

/**
 * Who a post's newsletter sign-ups probably are: a course guide gives its
 * course's level; admissions and qualifier posts give 'qualifier'; anything
 * else is 'general'.
 */
export function segmentForPost(post: {
  title: string
  tags: string[]
  category: { slug: string }
  courseLevel?: NoteLevel | null
}): NewsletterSegment {
  if (post.courseLevel) return post.courseLevel
  if (QUALIFIER_TOPICS.has(post.category.slug)) return 'qualifier'
  const text = `${post.title} ${post.tags.join(' ')}`.toLowerCase()
  return text.includes('qualifier') ? 'qualifier' : 'general'
}
