import type { Metadata } from 'next'

import {
  AssignmentRoute,
  assignmentMetadata,
  assignmentStaticParams,
} from '@/components/assignment/assignment-route'

export async function generateStaticParams() {
  return assignmentStaticParams('graded', true)
}

export async function generateMetadata({
  params,
}: PageProps<'/[program]/[course]/[week]/graded-assignment/[term]'>): Promise<Metadata> {
  return assignmentMetadata(await params, 'graded')
}

export default async function Page({
  params,
}: PageProps<'/[program]/[course]/[week]/graded-assignment/[term]'>) {
  return <AssignmentRoute params={await params} kind="graded" />
}
