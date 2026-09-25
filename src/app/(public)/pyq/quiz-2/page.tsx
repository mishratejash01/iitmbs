import type { Metadata } from 'next'

import { ExamHub, examHubMetadata } from '@/components/pyq/exam-hub'

export function generateMetadata(): Promise<Metadata> {
  return examHubMetadata('quiz-2')
}

export default function Page() {
  return <ExamHub exam="quiz-2" />
}
