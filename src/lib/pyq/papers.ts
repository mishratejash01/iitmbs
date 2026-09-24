import type { QuestionPaper } from '@/lib/data/question-papers'
import type { Faq } from '@/lib/data/types'
import { formatTerm, PYQ_EXAM_LABEL, PYQ_EXAMS, termSortKey, type PyqExam } from '@/lib/routes'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "2025-10-26" → "26 Oct 2025". */
export function formatExamDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number)
  return `${day} ${MONTHS[(month ?? 1) - 1]} ${year}`
}

/**
 * "September 2025 term, Quiz 1 (26 Oct 2025, afternoon)"; without the exam on
 * pages that list a single exam. Qualifier papers are named by their date,
 * since a qualifier admits students to the next term.
 */
export function paperHeading(paper: QuestionPaper, { exam = true } = {}): string {
  const qualifier = paper.exam === 'qualifier'
  const details = [
    paper.examDate && !qualifier ? formatExamDate(paper.examDate) : null,
    paper.session === 'fn' ? 'forenoon' : paper.session === 'an' ? 'afternoon' : null,
    paper.note,
    paper.variant > 1 ? `set ${paper.variant}` : null,
  ].filter(Boolean)
  const name = qualifier
    ? `Qualifier exam${paper.examDate ? `, ${formatExamDate(paper.examDate)}` : ''}`
    : exam
      ? `${formatTerm(paper.term)} term, ${PYQ_EXAM_LABEL[paper.exam]}`
      : `${formatTerm(paper.term)} term`
  return details.length ? `${name} (${details.join(', ')})` : name
}

/** "Pages 96 to 105" when the course's questions sit inside a longer session paper. */
export function pageRange(paper: QuestionPaper): string | null {
  if (!paper.pageFrom) return null
  return paper.pageTo && paper.pageTo !== paper.pageFrom
    ? `Pages ${paper.pageFrom} to ${paper.pageTo}`
    : `Page ${paper.pageFrom}`
}

/** Papers grouped by exam, in exam order. */
export function papersByExam(
  papers: QuestionPaper[],
): Array<{ exam: PyqExam; papers: QuestionPaper[] }> {
  return PYQ_EXAMS.map((exam) => ({
    exam,
    papers: papers.filter((paper) => paper.exam === exam),
  })).filter((group) => group.papers.length > 0)
}

/** "January 2023 to May 2026", or one term. Terms may be in any order. */
export function termSpan(terms: string[]): string | null {
  if (terms.length === 0) return null
  const sorted = [...terms].sort((a, b) => termSortKey(a) - termSortKey(b))
  const first = formatTerm(sorted[0] ?? '')
  const last = formatTerm(sorted.at(-1) ?? '')
  return first === last ? first : `${first} to ${last}`
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

/**
 * The span a set of papers covers. Qualifier papers admit students to a later
 * term, so they are spanned by exam month ("July 2022 to April 2025"); the
 * rest by term.
 */
export function paperSpan(papers: QuestionPaper[]): string | null {
  const dates = papers.map((paper) => paper.examDate).filter((d): d is string => Boolean(d))
  if (
    papers.length > 0 &&
    papers.every((p) => p.exam === 'qualifier') &&
    dates.length === papers.length
  ) {
    const month = (date: string) => {
      const [year, m] = date.split('-').map(Number)
      return `${MONTH_NAMES[(m ?? 1) - 1]} ${year}`
    }
    const sorted = [...dates].sort()
    const first = month(sorted[0] ?? '')
    const last = month(sorted.at(-1) ?? '')
    return first === last ? first : `${first} to ${last}`
  }
  return termSpan(papers.map((paper) => paper.term))
}

/**
 * Search phrases a PYQ page answers: the course's short name, full name and
 * code, each with the ways students ask for papers, for the page's exams.
 */
export function pyqKeywords(
  course: { name: string; shortName: string; code: string },
  exams: PyqExam[],
  { withoutExam = true } = {},
): string[] {
  const names = [course.shortName, course.name, course.code].map((name) => name.toLowerCase())
  const examNames = [
    ...(withoutExam ? [''] : []),
    ...exams.map((exam) => PYQ_EXAM_LABEL[exam].toLowerCase()),
  ]
  const phrases = ['pyq', 'previous year question paper', 'question paper with answers']
  const out = new Set<string>()
  for (const name of names) {
    for (const examName of examNames) {
      for (const phrase of phrases) {
        out.add(`${name} ${examName} ${phrase}`.replace(/\s+/g, ' ').trim())
      }
    }
    out.add(`iitm bs ${name} pyq`)
  }
  return [...out]
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`
}

/**
 * Questions students ask about a PYQ page, answered from the papers listed on
 * it (so the FAQ markup always matches what the page shows).
 */
export function pyqFaqs(
  course: { name: string; shortName: string; code: string },
  papers: QuestionPaper[],
  exam?: PyqExam,
): Faq[] {
  if (papers.length === 0) return []
  const what = exam ? `${course.shortName} ${PYQ_EXAM_LABEL[exam]}` : course.shortName
  const span = paperSpan(papers)
  const counts = papersByExam(papers).map(
    (group) =>
      `${group.papers.length} ${PYQ_EXAM_LABEL[group.exam]} ${group.papers.length === 1 ? 'paper' : 'papers'}`,
  )
  const faqs: Faq[] = [
    {
      id: 'where',
      question: `Where can I find IITM BS ${what} previous year question papers?`,
      answerMdx: `This page lists ${exam ? `${papers.length} ${what} ${papers.length === 1 ? 'paper' : 'papers'}` : joinList(counts)} for ${course.name} (${course.code}), from ${span}. Each link opens the paper in Google Drive.`,
    },
  ]
  const answered = papers.filter((paper) => paper.hasAnswers).length
  if (answered > 0) {
    faqs.push({
      id: 'answers',
      question: `Do these ${what} PYQs have answers?`,
      answerMdx:
        answered === papers.length
          ? 'Yes. These are IIT Madras exam papers with the correct options marked in green, so you can check your answers as you practise.'
          : `${answered} of the ${papers.length} papers ${answered === 1 ? 'marks' : 'mark'} the correct options in green. The others are question papers only.`,
    })
  }
  const inside = papers.find((paper) => paper.pageFrom && paper.pageTo)
  if (inside) {
    faqs.push({
      id: 'pages',
      question: `Why does a ${course.shortName} paper open a longer PDF?`,
      answerMdx: `IIT Madras prints one question paper per exam session, with every course sat in that session. Each link here says which pages hold the ${course.shortName} questions, for example ${pageRange(inside)?.toLowerCase()}.`,
    })
  }
  return faqs
}
