import { describe, expect, it } from 'vitest'

import { segmentForPost } from '@/lib/blog/segment'
import { splitForInserts } from '@/lib/blog/split'

describe('segmentForPost', () => {
  const post = (slug: string, title = 'A post', tags: string[] = []) => ({
    title,
    tags,
    category: { slug },
  })

  it('uses the course level for course guides', () => {
    expect(segmentForPost({ ...post('courses'), courseLevel: 'diploma' })).toBe('diploma')
  })

  it('marks admissions posts and qualifier titles or tags as qualifier', () => {
    expect(segmentForPost(post('admissions'))).toBe('qualifier')
    expect(segmentForPost(post('exams', 'Qualifier Exam Passing Marks'))).toBe('qualifier')
    expect(segmentForPost(post('fees', 'Fees', ['qualifier']))).toBe('qualifier')
  })

  it('falls back to general', () => {
    expect(segmentForPost(post('careers', 'Jobs after IITM BS'))).toBe('general')
  })
})

describe('splitForInserts', () => {
  it('cuts after the first section and before the questions', () => {
    const mdx = ['Intro', '## One', 'a', '## Two', 'b', '## Common questions', '### Q?', 'A.'].join(
      '\n',
    )
    const { parts, breaks } = splitForInserts(mdx)
    expect(breaks).toBe(2)
    expect(parts[0]).toBe('Intro\n## One\na')
    expect(parts[1]).toBe('## Two\nb')
    expect(parts[2]?.startsWith('## Common questions')).toBe(true)
    expect(parts.join('\n')).toBe(mdx)
  })

  it('uses the last section when there are no questions, and ignores code fences', () => {
    const mdx = ['Intro', '## One', '```', '## not a heading', '```', '## Two', '## Three'].join(
      '\n',
    )
    const { parts } = splitForInserts(mdx)
    expect(parts).toHaveLength(3)
    expect(parts[1]).toBe('## Two')
    expect(parts[2]).toBe('## Three')
  })

  it('leaves short articles whole', () => {
    expect(splitForInserts('Intro\n## Only').breaks).toBe(0)
    expect(splitForInserts('Intro\n## One\n## Two').breaks).toBe(1)
  })
})
