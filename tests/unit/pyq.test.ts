import { describe, expect, it } from 'vitest'

import type { QuestionPaper } from '@/lib/data/question-papers'
import {
  formatExamDate,
  pageRange,
  paperHeading,
  paperSpan,
  papersByExam,
  pyqFaqs,
  pyqKeywords,
  termSpan,
} from '@/lib/pyq/papers'

const paper = (overrides: Partial<QuestionPaper>): QuestionPaper => ({
  id: 'p',
  exam: 'quiz-1',
  term: '2025-sep',
  session: null,
  examDate: null,
  variant: 1,
  url: 'https://drive.google.com/file/d/x/view',
  fileName: null,
  pageFrom: null,
  pageTo: null,
  questionCount: null,
  hasAnswers: true,
  contributor: null,
  note: null,
  ...overrides,
})

describe('PYQ labels', () => {
  it('formats exam dates', () => {
    expect(formatExamDate('2025-10-26')).toBe('26 Oct 2025')
    expect(formatExamDate('2024-01-05')).toBe('5 Jan 2024')
  })

  it('names a paper by term, exam, date, session and set', () => {
    expect(paperHeading(paper({}))).toBe('September 2025 term, Quiz 1')
    expect(
      paperHeading(paper({ exam: 'end-term', examDate: '2025-12-14', session: 'fn', variant: 2 })),
    ).toBe('September 2025 term, End Term (14 Dec 2025, forenoon, set 2)')
    expect(paperHeading(paper({ examDate: '2025-10-26' }), { exam: false })).toBe(
      'September 2025 term (26 Oct 2025)',
    )
  })

  it('names qualifier papers by date', () => {
    expect(
      paperHeading(paper({ exam: 'qualifier', examDate: '2025-04-13', note: 're-attempt' })),
    ).toBe('Qualifier exam, 13 Apr 2025 (re-attempt)')
  })

  it('describes where the course sits inside a session paper', () => {
    expect(pageRange(paper({}))).toBeNull()
    expect(pageRange(paper({ pageFrom: 96, pageTo: 105 }))).toBe('Pages 96 to 105')
    expect(pageRange(paper({ pageFrom: 7, pageTo: 7 }))).toBe('Page 7')
  })

  it('spans qualifier papers by exam month', () => {
    expect(
      paperSpan([
        paper({ exam: 'qualifier', term: '2025-jan', examDate: '2025-04-13' }),
        paper({ exam: 'qualifier', term: '2022-may', examDate: '2022-07-10' }),
      ]),
    ).toBe('July 2022 to April 2025')
    expect(paperSpan([paper({ term: '2024-jan' }), paper({ term: '2025-sep' })])).toBe(
      'January 2024 to September 2025',
    )
  })

  it('spans terms in chronological order', () => {
    expect(termSpan([])).toBeNull()
    expect(termSpan(['2026-may', '2023-jan', '2024-sep'])).toBe('January 2023 to May 2026')
    expect(termSpan(['2025-sep'])).toBe('September 2025')
  })
})

describe('papersByExam', () => {
  it('keeps exam order and drops empty exams', () => {
    const groups = papersByExam([
      paper({ id: 'a', exam: 'end-term' }),
      paper({ id: 'b', exam: 'quiz-1' }),
      paper({ id: 'c', exam: 'end-term' }),
    ])
    expect(groups.map((g) => g.exam)).toEqual(['quiz-1', 'end-term'])
    expect(groups[1]?.papers.map((p) => p.id)).toEqual(['a', 'c'])
  })
})

describe('pyqKeywords', () => {
  const course = { name: 'Machine Learning Techniques', shortName: 'MLT', code: 'BSCS2007' }

  it('covers short name, full name and code for each exam', () => {
    const keywords = pyqKeywords(course, ['quiz-1', 'quiz-2', 'end-term'])
    expect(keywords).toContain('mlt pyq')
    expect(keywords).toContain('machine learning techniques quiz 1 previous year question paper')
    expect(keywords).toContain('bscs2007 end term pyq')
    expect(keywords).toContain('iitm bs mlt pyq')
    expect(new Set(keywords).size).toBe(keywords.length)
  })

  it('narrows to one exam', () => {
    const keywords = pyqKeywords(course, ['quiz-2'], { withoutExam: false })
    expect(keywords).toContain('mlt quiz 2 pyq')
    expect(keywords.some((k) => k.includes('quiz 1'))).toBe(false)
  })
})

describe('pyqFaqs', () => {
  const course = { name: 'Machine Learning Techniques', shortName: 'MLT', code: 'BSCS2007' }

  it('answers from the papers on the page', () => {
    const faqs = pyqFaqs(course, [
      paper({ id: 'a', exam: 'quiz-1', term: '2023-jan', pageFrom: 96, pageTo: 105 }),
      paper({ id: 'b', exam: 'end-term', term: '2025-sep', hasAnswers: false }),
    ])
    expect(faqs.map((f) => f.id)).toEqual(['where', 'answers', 'pages'])
    expect(faqs[0]?.answerMdx).toContain('1 Quiz 1 paper and 1 End Term paper')
    expect(faqs[0]?.answerMdx).toContain('from January 2023 to September 2025')
    expect(faqs[1]?.answerMdx).toBe(
      '1 of the 2 papers marks the correct options in green. The others are question papers only.',
    )
    expect(faqs[2]?.answerMdx).toContain('for example pages 96 to 105')
  })

  it('has nothing to say without papers', () => {
    expect(pyqFaqs(course, [])).toEqual([])
  })
})
