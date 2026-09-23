import type { Metadata } from 'next'

import { AssignmentRoute, assignmentMetadata, assignmentStaticParams } from '@/components/assignment/assignment-route'

export async function generateStaticParams() {
  return assignmentStaticParams('graded', false)
}

export async function generateMetadata({ params }: PageProps<'/[program]/[course]/[week]/graded-assignment'>): Promise<Metadata> {
  return assignmentMetadata(await params, 'graded')
}

export default async function Page({ params }: PageProps<'/[program]/[course]/[week]/graded-assignment'>) {
  return <AssignmentRoute params={await params} kind="graded" />
}
