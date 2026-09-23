import type { Metadata } from 'next'

import { AssignmentRoute, assignmentMetadata, assignmentStaticParams } from '@/components/assignment/assignment-route'

export async function generateStaticParams() {
  return assignmentStaticParams('practice', true)
}

export async function generateMetadata({
  params,
}: PageProps<'/[program]/[course]/[week]/practice-assignment/[term]'>): Promise<Metadata> {
  return assignmentMetadata(await params, 'practice')
}

export default async function Page({ params }: PageProps<'/[program]/[course]/[week]/practice-assignment/[term]'>) {
  return <AssignmentRoute params={await params} kind="practice" />
}
