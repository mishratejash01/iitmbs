import { describe, expect, it } from 'vitest'

import {
  formatDuration,
  isoDurationFromSeconds,
  lectureSortKey,
  parseLectureTitle,
} from '@/lib/lectures/videos'

describe('parseLectureTitle', () => {
  it('reads the IIT Madras "W1_L5A:" pattern', () => {
    expect(
      parseLectureTitle('W1_L5A: Sets examples - membership subsets & set comprehension'),
    ).toEqual({
      week: 1,
      lecture: '5A',
      title: 'Sets examples - membership subsets & set comprehension',
    })
    expect(parseLectureTitle('W12_L10: Wrap up')).toMatchObject({ week: 12, lecture: '10' })
    expect(parseLectureTitle('W1_L0: Introduction')).toMatchObject({ week: 1, lecture: '0' })
  })

  it('reads other common patterns', () => {
    expect(parseLectureTitle('Week 3 Lecture 2 - Probability')).toEqual({
      week: 3,
      lecture: '2',
      title: 'Probability',
    })
    expect(parseLectureTitle('L4.3: Hypothesis testing')).toEqual({
      week: 4,
      lecture: '3',
      title: 'Hypothesis testing',
    })
    expect(parseLectureTitle('W02-L05 | Graphs')).toMatchObject({ week: 2, lecture: '5' })
  })

  it('leaves titles without a week alone', () => {
    expect(parseLectureTitle('Course introduction')).toEqual({
      week: null,
      lecture: null,
      title: 'Course introduction',
    })
  })
})

describe('durations', () => {
  it('formats for people and for markup', () => {
    expect(formatDuration(754)).toBe('12:34')
    expect(formatDuration(3725)).toBe('1:02:05')
    expect(formatDuration(null)).toBeNull()
    expect(isoDurationFromSeconds(754)).toBe('PT12M34S')
    expect(isoDurationFromSeconds(3600)).toBe('PT1H')
    expect(isoDurationFromSeconds(45)).toBe('PT45S')
  })
})

describe('lectureSortKey', () => {
  it('orders 5, 5A, 5B, 6, 10', () => {
    const order = ['10', '5B', '6', '5', '5A'].sort((a, b) => lectureSortKey(a) - lectureSortKey(b))
    expect(order).toEqual(['5', '5A', '5B', '6', '10'])
  })
})
