import { ChevronDown } from 'lucide-react'

import { renderMdx } from '@/components/mdx/render'
import { Badge, metaRowClasses } from '@/components/ui/badge'
import type { Question } from '@/lib/data/types'

import { ChoiceChecker } from './choice-checker'

const TYPE_LABEL: Record<Question['type'], string> = {
  mcq: 'Single choice',
  msq: 'Multiple select',
  numeric: 'Numerical answer',
  text: 'Short answer',
}

const letter = (index: number) => String.fromCharCode(65 + index)

export async function QuestionCard({ question }: { question: Question }) {
  const [body, hint, answer, explanation, ...options] = await Promise.all([
    renderMdx(question.questionMdx, { headingOffset: 2 }),
    renderMdx(question.hintMdx, { headingOffset: 2 }),
    renderMdx(question.answerMdx, { headingOffset: 2 }),
    renderMdx(question.explanationMdx, { headingOffset: 2 }),
    ...question.options.map((option) => renderMdx(option.labelMdx)),
  ])
  const released =
    question.answerMdx !== null || question.explanationMdx !== null || question.answerKey !== null
  const choice = question.type === 'mcq' || question.type === 'msq'
  const correct =
    question.answerKey && 'correct' in question.answerKey ? question.answerKey.correct : null
  const headingId = `question-${question.position}`

  return (
    <article
      id={`q-${question.position}`}
      aria-labelledby={headingId}
      className="rounded-card border border-border bg-card p-4 sm:p-5"
    >
      <header className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h3 id={headingId} className="font-semibold text-text">
          Question {question.position}
        </h3>
        <p className={metaRowClasses}>
          <Badge>{TYPE_LABEL[question.type]}</Badge>
          {question.marks ? <Badge>{question.marks} marks</Badge> : null}
          {question.difficulty ? <Badge className="capitalize">{question.difficulty}</Badge> : null}
        </p>
      </header>

      <div className="prose-content mt-3">{body.content}</div>

      {choice && options.length > 0 ? (
        released && correct ? (
          <ChoiceChecker
            questionId={question.id}
            multiple={question.type === 'msq'}
            correct={correct}
            options={question.options.map((option, index) => ({
              id: option.id,
              letter: letter(index),
              label: options[index]?.content,
            }))}
          />
        ) : (
          <ol className="mt-4 border-t border-border" aria-label="Options">
            {question.options.map((option, index) => (
              <li key={option.id} className="flex items-start gap-3 border-b border-border py-3">
                <span className="font-semibold text-accent-ink">{letter(index)}.</span>
                <div className="prose-content min-w-0 flex-1 [&_p]:m-0">
                  {options[index]?.content}
                </div>
              </li>
            ))}
          </ol>
        )
      ) : null}

      {question.conceptTags.length > 0 ? (
        <p className={`mt-4 ${metaRowClasses}`} aria-label="Concepts">
          {question.conceptTags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </p>
      ) : null}

      {hint.content ? (
        <details
          className="group mt-4 rounded-control bg-surface"
          data-track="hint_reveal"
          data-track-question-id={question.id}
          data-track-position={question.position}
        >
          <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 font-medium text-text hover:text-accent-ink [&::-webkit-details-marker]:hidden">
            Show hint
            <ChevronDown
              aria-hidden="true"
              className="ml-auto size-4 text-accent-ink transition-transform group-open:rotate-180"
            />
          </summary>
          <div className="prose-content px-4 pb-4">{hint.content}</div>
        </details>
      ) : null}

      {released && (answer.content || explanation.content) ? (
        <details
          className="group mt-3 rounded-control bg-accent-soft"
          data-track="solution_view"
          data-track-question-id={question.id}
          data-track-position={question.position}
        >
          <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 font-medium text-text hover:text-accent-ink [&::-webkit-details-marker]:hidden">
            Show worked solution
            <ChevronDown
              aria-hidden="true"
              className="ml-auto size-4 text-accent-ink transition-transform group-open:rotate-180"
            />
          </summary>
          <div className="space-y-3 px-4 pb-4">
            {answer.content ? (
              <div>
                <p className="text-small font-semibold text-text">Answer</p>
                <div className="prose-content mt-1">{answer.content}</div>
              </div>
            ) : null}
            {explanation.content ? (
              <div>
                <p className="text-small font-semibold text-text">Explanation</p>
                <div className="prose-content mt-1">{explanation.content}</div>
              </div>
            ) : null}
          </div>
        </details>
      ) : null}
    </article>
  )
}
