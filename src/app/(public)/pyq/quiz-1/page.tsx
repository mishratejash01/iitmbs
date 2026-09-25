import type { Metadata } from 'next'

import { ExamHub, examHubMetadata } from '@/components/pyq/exam-hub'

export function generateMetadata(): Promise<Metadata> {
  return examHubMetadata('quiz-1')
}

export default function Page() {
  return <ExamHub exam="quiz-1" />
}
