import type { Metadata } from 'next'

import { noteCrumbs, noteMetadata, noteTitle } from '@/components/notes/note-route'
import { NoteView } from '@/components/notes/note-view'
import { getCourseCore, getCourseParams } from '@/lib/data/courses'
import { getCourseNotePage } from '@/lib/data/notes'
import { redirectOrNotFound } from '@/lib/data/redirects'
import { PLACEHOLDER_SEGMENT, withPlaceholder } from '@/lib/static-params'

export async function generateStaticParams() {
  const courses = await getCourseParams()
  const params = (
    await Promise.all(
      courses.map(async ({ program, course }) => {
        const core = await getCourseCore(program, course)
        const exists = core?.notes.some((n) => n.kind === 'formula_sheet')
        return exists ? [{ program, course }] : []
      }),
    )
  ).flat()
  return withPlaceholder(params, { program: PLACEHOLDER_SEGMENT, course: PLACEHOLDER_SEGMENT })
}

async function load(params: PageProps<'/[program]/[course]/formula-sheet'>['params']) {
  const { program, course } = await params
  return getCourseNotePage(program, course, 'formula_sheet')
}

export async function generateMetadata({
  params,
}: PageProps<'/[program]/[course]/formula-sheet'>): Promise<Metadata> {
  return noteMetadata(await load(params))
}

export default async function FormulaSheetPage({
  params,
}: PageProps<'/[program]/[course]/formula-sheet'>) {
  const data = await load(params)
  if (!data) {
    const { program, course } = await params
    return redirectOrNotFound(`/${program}/${course}/formula-sheet`)
  }
  return <NoteView data={data} title={noteTitle(data)} crumbs={noteCrumbs(data)} />
}
