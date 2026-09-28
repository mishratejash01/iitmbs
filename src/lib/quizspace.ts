/**
 * Since 28 September 2026 this site no longer hosts previous year papers.
 * Every old /pyq address redirects permanently to the matching QuizSpace page
 * (next.config.ts), so search engines carry the rankings across, and links on
 * this site point there directly.
 *
 * Plain data and functions only: next.config.ts imports this file.
 */

export const QUIZSPACE_ORIGIN = 'https://quizspace.unknowniitians.com'

export const QUIZSPACE_EXAMS = ['qualifier', 'quiz-1', 'quiz-2', 'end-term'] as const
export type QuizSpaceExam = (typeof QUIZSPACE_EXAMS)[number]

/**
 * [our course slug, QuizSpace course slug, old alias slugs]. Our slug is the
 * note_courses slug that /pyq, /notes and /resources/lectures share. Checked
 * against QuizSpace's sitemap: every exam page we had exists there. QuizSpace
 * has no Electronic Systems English II, so es-english-2 goes to English 2.
 */
const COURSES: ReadonlyArray<readonly [string, string, string]> = [
  ['advanced-algorithms', 'advanced-algorithms', 'bscs4021 cs4021'],
  ['ai-search', 'ai-search', 'bscs3003 cs3003'],
  ['algorithmic-thinking-bioinformatics', 'algorithmic-thinking-bio', 'bsbt4001 bt4001'],
  ['algorithms-for-data-science', 'ads', 'bsda5003 da5003'],
  ['analog-electronic-systems', 'aes', 'ee2102'],
  ['bdm', 'bdm', 'bsms2001 ms2001'],
  ['big-data', 'intro-big-data', 'bsda5001 da5001'],
  ['big-data-biological-networks', 'bbn', 'bsbt4002 bt4002'],
  ['business-analytics', 'business-analytics', 'bsms2002 ms2002'],
  ['c-programming', 'programming-in-c', 'bscs3005 cs3005'],
  ['computational-thinking', 'computational-thinking', 'bscs1001 cs1001'],
  ['computer-networks', 'computer-networks', 'bscs4024 cs4024'],
  ['computer-systems-design', 'computer-system-design', 'bscs3031 cs3031'],
  ['control-engineering', 'control-engineering', 'ee3102'],
  ['corporate-finance', 'corporate-finance', 'bsms3034 ms3034'],
  ['data-science-ai-lab', 'ds-ai-lab', 'bsda4001 da4001'],
  ['data-visualization-design', 'dvd', 'bscs4001 cs4001'],
  ['dbms', 'dbms', 'bscs2001 cs2001'],
  ['deep-learning', 'deep-learning', 'bscs3004 cs3004'],
  ['deep-learning-computer-vision', 'dl-cv', 'bsda5006 da5006'],
  ['deep-learning-genai', 'dl-genai', 'bsda2001 da2001'],
  ['deep-learning-practice', 'dlp', 'bsda5013 da5013'],
  ['design-thinking', 'design-thinking', 'bsms4002 ms4002'],
  ['digital-signal-processing', 'dsp', 'ee3101'],
  ['digital-system-design', 'dsd', 'ee2103'],
  ['digital-systems', 'digital-systems', 'ee1102'],
  ['electrical-electronic-circuits', 'eec', 'ee1103'],
  ['embedded-c-programming', 'embedded-c', 'cs2101'],
  ['english-1', 'english-1', 'bshs1001 hs1001'],
  ['english-2', 'english-2', 'bshs1002 hs1002'],
  ['es-c-programming', 'es-c-programming', 'cs1101'],
  ['es-english-1', 'es-english-1', 'hs1101'],
  ['es-english-2', 'english-2', 'hs1102'],
  ['es-linux-programming', 'es-linux', 'cs1102'],
  ['es-python-programming', 'es-python', 'cs1002'],
  ['estc', 'estc', 'ee1101'],
  ['financial-forensics', 'financial-forensics', 'bsms4003 ms4003'],
  ['game-theory', 'game-theory', 'bsms4023 ms4023'],
  ['generative-ai', 'genai-math', 'bsda5002 da5002'],
  ['industry-4-0', 'industry-4', 'bsms4001 ms4001'],
  ['java', 'java', 'bscs2005 cs2005'],
  ['linear-statistical-models', 'lsm', 'bsma3012 ma3012'],
  ['llm', 'llm', 'bsda5004 da5004'],
  ['mad-1', 'mad-1', 'bscs2003 cs2003'],
  ['mad-2', 'mad-2', 'bscs2006 cs2006'],
  ['managerial-economics', 'managerial-economics', 'bsms3033 ms3033'],
  ['market-research', 'market-research', 'bsms3002 ms3002'],
  ['math-for-electronics-1', 'es-math-1', 'ma1101'],
  ['math-for-electronics-2', 'es-math-2', 'ma2101'],
  ['mathematical-thinking', 'mathematical-thinking', 'bsma2001 ma2001'],
  ['maths-1', 'maths-1', 'bsma1001 ma1001'],
  ['maths-2', 'maths-2', 'bsma1003 ma1003'],
  ['mlf', 'mlf', 'bscs2004 cs2004'],
  ['mlp', 'mlp', 'bscs2008 cs2008'],
  ['mlt', 'mlt', 'bscs2007 cs2007'],
  ['nlp', 'inlp', 'bsda5005 da5005'],
  ['operating-systems', 'operating-systems', 'bscs4022 cs4022'],
  ['pdsa', 'pdsa', 'bscs2002 cs2002'],
  ['psosm', 'psosm', 'bscs4003 cs4003'],
  ['python', 'python', 'bscs1002'],
  ['reinforcement-learning', 'rl', 'bsda5007 da5007'],
  ['sensors-and-applications', 'sensors', 'ee3103'],
  ['signals-and-systems', 'signals-systems', 'ee2101'],
  ['software-engineering', 'software-engineering', 'bscs3001 cs3001'],
  ['software-testing', 'software-testing', 'bscs3002 cs3002'],
  ['speech-technology', 'speech-technology', 'bsee4001 ee4001'],
  ['spg', 'spg', 'bsgn3001 gn3001'],
  ['statistical-computing', 'statistical-computing', 'bsma3014 ma3014'],
  ['stats-1', 'statistics-1', 'bsma1002 ma1002'],
  ['stats-2', 'statistics-2', 'bsma1004 ma1004'],
  ['system-commands', 'system-commands', 'bsse2001 se2001'],
  ['tds', 'tds', 'bsse2002 se2002'],
]

const QUIZSPACE_SLUG = new Map(COURSES.map(([slug, to]) => [slug, to]))

/** QuizSpace's page for one of our courses (or one exam of it), or null if it has none. */
export function quizSpaceCourseUrl(slug: string, exam?: QuizSpaceExam): string | null {
  const to = QUIZSPACE_SLUG.get(slug)
  if (!to) return null
  return `${QUIZSPACE_ORIGIN}/pyq/${to}${exam ? `/${exam}` : ''}`
}

/** QuizSpace's page for one exam across every course, e.g. all qualifier papers. */
export const quizSpaceExamUrl = (exam: QuizSpaceExam) => `${QUIZSPACE_ORIGIN}/exam/${exam}`

type Redirect = { source: string; destination: string; permanent: true }

/**
 * Permanent redirects for every old /pyq address, most specific first: the
 * index, the exam hubs, each course (its slug or an old alias) with an exam or
 * without, then anything else under /pyq to QuizSpace's home page.
 */
export function quizSpaceRedirects(): Redirect[] {
  const exams = QUIZSPACE_EXAMS.join('|')
  const rule = (source: string, destination: string): Redirect => ({
    source,
    destination,
    permanent: true,
  })
  return [
    rule('/pyq', `${QUIZSPACE_ORIGIN}/`),
    rule(`/pyq/:exam(${exams})`, `${QUIZSPACE_ORIGIN}/exam/:exam`),
    ...COURSES.flatMap(([slug, to, aliases]) => {
      const names = [slug, ...aliases.split(' ').filter(Boolean)].join('|')
      return [
        rule(`/pyq/:course(${names})/:exam(${exams})`, `${QUIZSPACE_ORIGIN}/pyq/${to}/:exam`),
        rule(`/pyq/:course(${names})/:rest*`, `${QUIZSPACE_ORIGIN}/pyq/${to}`),
      ]
    }),
    rule('/pyq/:rest+', `${QUIZSPACE_ORIGIN}/`),
  ]
}
