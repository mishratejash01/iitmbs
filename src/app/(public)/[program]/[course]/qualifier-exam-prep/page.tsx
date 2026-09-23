import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { noteCrumbs, noteMetadata, noteTitle } from '@/components/notes/note-route'
import { NoteView } from '@/components/notes/note-view'
import { getCourseCore, getCourseParams } from '@/lib/data/courses'
import { getCourseNotePage } from '@/lib/data/notes'
import { PLACEHOLDER_SEGMENT, withPlaceholder } from '@/lib/static-params'

export async function generateStaticParams() {
  const courses = await getCourseParams()
  const params = (
    await Promise.all(
      courses.map(async ({ program, course }) => {
        const core = await getCourseCore(program, course)
        const exists = 
          core?.notes.some((n) => n.kind === 'exam_prep') ||
          core?.assignments.some((a) => a.weekNumber === null && a.type === 'practice')
        return exists ? [{ program, course }] : []
      }),
    )
  ).flat()
  return withPlaceholder(params, { program: PLACEHOLDER_SEGMENT, course: PLACEHOLDER_SEGMENT })
}

async function load(params: PageProps<'/[program]/[course]/qualifier-exam-prep'>['params']) {
  const { program, course } = await params
  return getCourseNotePage(program, course, 'exam_prep')
}

export async function generateMetadata({ params }: PageProps<'/[program]/[course]/qualifier-exam-prep'>): Promise<Metadata> {
  return noteMetadata(await load(params))
}

export default async function ExamPrepPage({ params }: PageProps<'/[program]/[course]/qualifier-exam-prep'>) {
  const data = await load(params)
  if (!data) notFound()
  return <NoteView data={data} title={noteTitle(data)} crumbs={noteCrumbs(data)} />
}
