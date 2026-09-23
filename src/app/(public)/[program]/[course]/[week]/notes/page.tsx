import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { noteCrumbs, noteMetadata, noteTitle, weekNoteNeighbours } from '@/components/notes/note-route'
import { NoteView } from '@/components/notes/note-view'
import { getCourseCore, getCourseParams } from '@/lib/data/courses'
import { getWeekNotePage } from '@/lib/data/notes'
import { parseWeekSegment } from '@/lib/routes'
import { PLACEHOLDER_SEGMENT, withPlaceholder } from '@/lib/static-params'

export async function generateStaticParams() {
  const courses = await getCourseParams()
  const params = (
    await Promise.all(
      courses.map(async ({ program, course }) => {
        const core = await getCourseCore(program, course)
        return (core?.notes ?? [])
          .filter((n) => n.kind === 'week' && n.weekNumber !== null)
          .map((n) => ({ program, course, week: `week-${n.weekNumber}` }))
      }),
    )
  ).flat()
  return withPlaceholder(params, { program: PLACEHOLDER_SEGMENT, course: PLACEHOLDER_SEGMENT, week: PLACEHOLDER_SEGMENT })
}

async function load(params: PageProps<'/[program]/[course]/[week]/notes'>['params']) {
  const { program, course, week } = await params
  const n = parseWeekSegment(week)
  return n === null ? null : getWeekNotePage(program, course, n)
}

export async function generateMetadata({ params }: PageProps<'/[program]/[course]/[week]/notes'>): Promise<Metadata> {
  return noteMetadata(await load(params))
}

export default async function WeekNotesPage({ params }: PageProps<'/[program]/[course]/[week]/notes'>) {
  const data = await load(params)
  if (!data) notFound()
  const { previous, next } = weekNoteNeighbours(data)
  return <NoteView data={data} title={noteTitle(data)} crumbs={noteCrumbs(data)} previous={previous} next={next} />
}
