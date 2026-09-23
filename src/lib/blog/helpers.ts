import type { BlogPostSummary } from '@/lib/data/blog'
import type { Faq } from '@/lib/data/types'

/**
 * Posts to read next: shared tags count most, then the same category, then
 * the same programme. Ties go to the newer post.
 */
export function relatedPosts(
  post: BlogPostSummary,
  all: BlogPostSummary[],
  limit = 6,
): BlogPostSummary[] {
  const tags = new Set(post.tags)
  return all
    .filter((other) => other.id !== post.id)
    .map((other) => ({
      other,
      score:
        other.tags.filter((tag) => tags.has(tag)).length * 3 +
        (other.category.id === post.category.id ? 2 : 0) +
        (post.program && other.program?.slug === post.program.slug ? 1 : 0),
    }))
    .filter(({ score }) => score > 0)
    .sort(
      (a, b) =>
        b.score - a.score || (b.other.publishedAt ?? '').localeCompare(a.other.publishedAt ?? ''),
    )
    .slice(0, limit)
    .map(({ other }) => other)
}

/** Posts in a category: pinned order first, then newest. */
export function postsInCategory(all: BlogPostSummary[], categoryId: string): BlogPostSummary[] {
  return all
    .filter((post) => post.category.id === categoryId)
    .sort(
      (a, b) =>
        a.sortOrder - b.sortOrder || (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''),
    )
}

const QUESTIONS_HEADING = /^##\s+(?:common questions|frequently asked questions|faqs?)\s*$/im

/**
 * The questions in a post's "Common questions" section (### question, then
 * its answer), for FAQPage markup. They are visible on the page, which is
 * what the markup requires.
 */
export function faqsFromBody(postId: string, bodyMdx: string): Faq[] {
  const start = QUESTIONS_HEADING.exec(bodyMdx)
  if (!start) return []
  const section = bodyMdx.slice(start.index + start[0].length).split(/^##\s/m)[0] ?? ''
  return section
    .split(/^###\s+/m)
    .slice(1)
    .flatMap((chunk, index) => {
      const [question = '', ...answer] = chunk.split('\n')
      const answerMdx = answer.join('\n').trim()
      return question.trim() && answerMdx
        ? [{ id: `${postId}-q${index + 1}`, question: question.trim(), answerMdx }]
        : []
    })
}
