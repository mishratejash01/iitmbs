import type { QuestionPaper } from '@/lib/data/question-papers'
import { pageRange, paperHeading } from '@/lib/pyq/papers'

/** Question papers open in Google Drive (outbound clicks are tracked site-wide). */
export function PaperList({
  papers,
  label,
  showExam = true,
}: {
  papers: QuestionPaper[]
  label: string
  showExam?: boolean
}) {
  if (papers.length === 0) return null
  return (
    <ul aria-label={label} className="border-t border-border">
      {papers.map((paper) => {
        const pages = pageRange(paper)
        return (
          <li key={paper.id} className="border-b border-border">
            <a
              href={paper.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-baseline justify-between gap-4 py-4"
            >
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-text decoration-accent-ink/40 underline-offset-4 group-hover:text-accent-ink group-hover:underline">
                  {paperHeading(paper, { exam: showExam })}
                </span>
                <span className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted">
                  {pages ? <span>{pages}</span> : null}
                  {paper.questionCount ? <span>{paper.questionCount} questions</span> : null}
                  {paper.hasAnswers ? <span>Answers marked</span> : null}
                  {paper.contributor ? <span>by {paper.contributor}</span> : null}
                  <span>PDF</span>
                </span>
              </span>
              <span className="shrink-0 text-small font-semibold text-accent-ink">Open</span>
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </li>
        )
      })}
    </ul>
  )
}
