import { describe, expect, it } from 'vitest'

import { faqsFromBody, postLanguage, relatedPosts, topPosts } from '@/lib/blog/helpers'
import type { BlogPostSummary } from '@/lib/data/blog'

const post = (id: string, over: Partial<BlogPostSummary> = {}): BlogPostSummary => ({
  id,
  slug: id,
  path: `/blog/${id}`,
  title: id,
  summary: null,
  category: { id: 'fees', slug: 'fees', name: 'Fees', path: '/blog/category/fees' },
  program: null,
  tags: [],
  isFeatured: false,
  sortOrder: 0,
  readingMinutes: 3,
  publishedAt: '2026-09-24T00:00:00Z',
  updatedAt: '2026-09-24T00:00:00Z',
  ...over,
})

describe('faqsFromBody', () => {
  it('reads each question and answer under "Common questions"', () => {
    const body = [
      'Intro.',
      '## Fees',
      '### Not a question',
      'Text.',
      '## Common questions',
      '### Is there a fee waiver?',
      'Yes, for some families.',
      '',
      'Details.',
      '### Can I pay later?',
      'No.',
    ].join('\n')
    expect(faqsFromBody('p', body)).toEqual([
      {
        id: 'p-q1',
        question: 'Is there a fee waiver?',
        answerMdx: 'Yes, for some families.\n\nDetails.',
      },
      { id: 'p-q2', question: 'Can I pay later?', answerMdx: 'No.' },
    ])
  })

  it('stops at the next section and ignores posts without the section', () => {
    const body = '## Common questions\n### Q?\nA.\n## After\n### Other\nB.'
    expect(faqsFromBody('p', body).map((f) => f.question)).toEqual(['Q?'])
    expect(faqsFromBody('p', '## Other\n### Q?\nA.')).toEqual([])
  })
})

describe('relatedPosts', () => {
  it('ranks shared tags above the same category and skips the post itself', () => {
    const base = post('base', { tags: ['fees', 'fee-waiver'] })
    const sameTags = post('tags', {
      tags: ['fee-waiver'],
      category: { id: 'exams', slug: 'exams', name: 'Exams', path: '/blog/category/exams' },
    })
    const sameCategory = post('category')
    const unrelated = post('none', {
      category: { id: 'exams', slug: 'exams', name: 'Exams', path: '/blog/category/exams' },
    })
    expect(relatedPosts(base, [base, unrelated, sameCategory, sameTags]).map((p) => p.id)).toEqual([
      'tags',
      'category',
    ])
  })
})

describe('topPosts', () => {
  it('puts featured posts first, then pinned order, then newest', () => {
    const posts = [
      post('old', { sortOrder: 1, publishedAt: '2026-01-01T00:00:00Z' }),
      post('new', { sortOrder: 1, publishedAt: '2026-09-01T00:00:00Z' }),
      post('pinned', { sortOrder: 0 }),
      post('featured', { sortOrder: 5, isFeatured: true }),
    ]
    expect(topPosts(posts, 3).map((p) => p.id)).toEqual(['featured', 'pinned', 'new'])
  })
})

describe('postLanguage', () => {
  it('spots Hindi posts and ignores Latin link targets', () => {
    expect(
      postLanguage(
        'यही जानकारी English में पढ़ें: [What Is the IIT Madras BS Degree?](/blog/what-is-iitm-bs-degree)\n\nIIT Madras का BS degree एक online degree है, जिसमें पढ़ाई घर से होती है।',
      ),
    ).toBe('hi')
    expect(
      postLanguage(
        'The IITM BS is taught in English. [Hindi explainer](/blog/iit-madras-bs-degree-kya-hai)',
      ),
    ).toBe('en')
  })
})
