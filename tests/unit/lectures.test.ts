import { describe, expect, it } from 'vitest'

import {
  formatDuration,
  isLiveSession,
  inheritWeeks,
  isoDurationFromSeconds,
  lectureLabel,
  lectureSortKey,
  orderLectures,
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

  it('reads the other formats used on the channel', () => {
    expect(parseLectureTitle('W1_L1.1: A generic optimization problem')).toMatchObject({
      week: 1,
      lecture: '1.1',
      title: 'A generic optimization problem',
    })
    expect(parseLectureTitle('W1.L1. What is machine learning?')).toMatchObject({
      week: 1,
      lecture: '1',
      title: 'What is machine learning?',
    })
    expect(parseLectureTitle('W6L31_Subset Sum')).toEqual({
      week: 6,
      lecture: '31',
      title: 'Subset Sum',
    })
    expect(parseLectureTitle('W3_L3_Software management - part 01')).toMatchObject({
      week: 3,
      lecture: '3',
    })
    expect(parseLectureTitle('W1_T2: Tutorial 2')).toMatchObject({ week: 1, lecture: 'T2' })
    expect(parseLectureTitle('1.1 : What is an App?')).toEqual({
      week: 1,
      lecture: '1',
      title: 'What is an App?',
    })
    expect(parseLectureTitle('1.2 Introduction to Pytorch and Tensors')).toMatchObject({
      week: 1,
      lecture: '2',
    })
    expect(parseLectureTitle('L 1.2 : Basic Statistics and Introduction to R')).toMatchObject({
      week: 1,
      lecture: '2',
    })
    expect(parseLectureTitle('W0_Introduction to statistical computing')).toEqual({
      week: 0,
      lecture: null,
      title: 'Introduction to statistical computing',
    })
    expect(parseLectureTitle('Week 02 - Additional Lecture 01')).toMatchObject({
      week: 2,
      lecture: null,
    })
  })

  it('reads lecture numbers without a week', () => {
    expect(parseLectureTitle('L2: Brief history of deep learning')).toEqual({
      week: null,
      lecture: '2',
      title: 'Brief history of deep learning',
    })
    expect(parseLectureTitle('Lec 1 - Introduction to Sequential Decision Making')).toMatchObject({
      week: null,
      lecture: '1',
    })
    expect(parseLectureTitle('Lecture 1:introduction to datasets')).toMatchObject({
      week: null,
      lecture: '1',
      title: 'introduction to datasets',
    })
    expect(parseLectureTitle('15. Hedge Algorithm and its Regret: A Recap')).toEqual({
      week: null,
      lecture: '15',
      title: 'Hedge Algorithm and its Regret: A Recap',
    })
    expect(parseLectureTitle('17: Coding for Synthesis')).toMatchObject({ lecture: '17' })
    expect(parseLectureTitle('Week 2 Tutorial 2.6')).toEqual({
      week: 2,
      lecture: 'T2.6',
      title: 'Tutorial 2.6',
    })
    expect(parseLectureTitle('Week 02 - Tutorial 06')).toEqual({
      week: 2,
      lecture: 'T6',
      title: 'Tutorial 6',
    })
    expect(parseLectureTitle('9.60000000000001 : Further Discussion on Registers')).toMatchObject({
      week: null,
      lecture: null,
    })
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
  it('orders lectures, sub-lectures and tutorials', () => {
    const order = ['T1', '10', '5B', '1.2', '6', '5', '1.1', '5A', '1'].sort(
      (a, b) => lectureSortKey(a) - lectureSortKey(b),
    )
    expect(order).toEqual(['1', '1.1', '1.2', '5', '5A', '5B', '6', '10', 'T1'])
  })
})

describe('labels', () => {
  it('names lectures and tutorials', () => {
    expect(lectureLabel('5A')).toBe('Lecture 5A')
    expect(lectureLabel('T2')).toBe('Tutorial 2')
    expect(lectureLabel(null)).toBeNull()
  })

  it('spots live sessions', () => {
    expect(isLiveSession('Live_Dynamic Inventory Management using AI')).toBe(true)
    expect(isLiveSession('Live - Causality and its antecedents')).toBe(true)
    expect(isLiveSession('W1_L1: Course outline')).toBe(false)
  })
})

describe('inheritWeeks', () => {
  const weeks = (list: Array<number | null>) =>
    inheritWeeks(list.map((week) => ({ week }))).map((video) => video.week)

  it('fills a gap only when both neighbours agree', () => {
    expect(weeks([3, null, null, 3, null, 4])).toEqual([3, 3, 3, 3, null, 4])
    expect(weeks([null, 1, null])).toEqual([null, 1, null])
  })
})

describe('orderLectures', () => {
  const video = (week: number | null, lecture: string | null, position: number) => ({
    week,
    lecture,
    position,
  })
  const order = (list: ReturnType<typeof video>[]) =>
    orderLectures(list).map((v) => `${v.week}/${v.lecture}/${v.position}`)

  it('sorts numbered weeks by lecture and the rest by playlist order', () => {
    expect(
      order([
        video(2, '2', 0),
        video(null, null, 1),
        video(2, '1', 2),
        video(0, null, 3),
        video(null, '8', 4),
        video(null, null, 5),
        video(2, null, 6),
      ]),
    ).toEqual(['0/null/3', '2/1/2', '2/2/0', '2/null/6', 'null/null/1', 'null/8/4', 'null/null/5'])
  })
})
