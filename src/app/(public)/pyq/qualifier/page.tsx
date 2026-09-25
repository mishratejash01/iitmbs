import type { Metadata } from 'next'

import { ExamHub, examHubMetadata } from '@/components/pyq/exam-hub'

export function generateMetadata(): Promise<Metadata> {
  return examHubMetadata('qualifier')
}

export default function Page() {
  return <ExamHub exam="qualifier" />
}
