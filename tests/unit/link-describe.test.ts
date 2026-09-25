import { describe, expect, it } from 'vitest'

import { describeLink } from '@/lib/links/describe'

describe('describeLink', () => {
  it('recognises YouTube videos', () => {
    expect(describeLink('https://youtu.be/dQw4w9WgXcQ')).toEqual({
      kind: 'youtube',
      id: 'dQw4w9WgXcQ',
    })
    expect(describeLink('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10')).toMatchObject({
      kind: 'youtube',
    })
  })

  it('treats relative and same-site links as internal', () => {
    expect(describeLink('/qualifier')).toEqual({ kind: 'internal', path: '/qualifier' })
    expect(describeLink('https://example.in/notes#top', 'https://example.in')).toEqual({
      kind: 'internal',
      path: '/notes#top',
    })
  })

  it('marks IIT Madras hosts as official and rejects other schemes', () => {
    expect(describeLink('https://study.iitm.ac.in/ds/')).toMatchObject({
      kind: 'external',
      host: 'study.iitm.ac.in',
      official: true,
    })
    expect(describeLink('https://www.iitm.ac.in/')).toMatchObject({ official: true })
    expect(describeLink('https://docs.google.com/document/d/x')).toMatchObject({
      host: 'docs.google.com',
      official: false,
    })
    expect(describeLink('javascript:alert(1)')).toBeNull()
  })
})
