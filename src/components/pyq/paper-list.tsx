import { CheckCircle2, ExternalLink, FileText } from 'lucide-react'

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
    <ul
      aria-label={label}
      className="divide-y divide-border rounded-card border border-border bg-card"
    >
      {papers.map((paper) => {
        const pages = pageRange(paper)
        return (
          <li key={paper.id}>
            <a
              href={paper.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-3 px-4 py-3.5 hover:bg-surface"
            >
              <FileText aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-accent-ink" />
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-text group-hover:text-accent-ink">
                  {paperHeading(paper, { exam: showExam })}
                </span>
                <span className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted">
                  {pages ? <span>{pages}</span> : null}
                  {paper.questionCount ? <span>{paper.questionCount} questions</span> : null}
                  {paper.hasAnswers ? (
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 aria-hidden="true" className="size-3" /> Answers marked
                    </span>
                  ) : null}
                  {paper.contributor ? <span>by {paper.contributor}</span> : null}
                  <span>PDF</span>
                </span>
              </span>
              <ExternalLink aria-hidden="true" className="mt-1 size-4 shrink-0 text-muted" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </li>
        )
      })}
    </ul>
  )
}
