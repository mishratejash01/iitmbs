import type { Metadata } from 'next'

import { ExamHub, examHubMetadata } from '@/components/pyq/exam-hub'

export function generateMetadata(): Promise<Metadata> {
  return examHubMetadata('end-term')
}

export default function Page() {
  return <ExamHub exam="end-term" />
}
