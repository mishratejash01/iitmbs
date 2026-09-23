import type { Metadata } from 'next'

import { noteCrumbs, noteMetadata, noteTitle } from '@/components/notes/note-route'
import { NoteView } from '@/components/notes/note-view'
import { getTopicNotePage, getTopicNoteParams } from '@/lib/data/notes'
import { redirectOrNotFound } from '@/lib/data/redirects'
import { PLACEHOLDER_SEGMENT, withPlaceholder } from '@/lib/static-params'

export async function generateStaticParams() {
  return withPlaceholder(await getTopicNoteParams(), {
    program: PLACEHOLDER_SEGMENT,
    course: PLACEHOLDER_SEGMENT,
    slug: PLACEHOLDER_SEGMENT,
  })
}

async function load(params: PageProps<'/[program]/[course]/notes/[slug]'>['params']) {
  const { program, course, slug } = await params
  return getTopicNotePage(program, course, slug)
}

export async function generateMetadata({
  params,
}: PageProps<'/[program]/[course]/notes/[slug]'>): Promise<Metadata> {
  return noteMetadata(await load(params))
}

export default async function TopicNotePage({
  params,
}: PageProps<'/[program]/[course]/notes/[slug]'>) {
  const data = await load(params)
  if (!data) {
    const { program, course, slug } = await params
    return redirectOrNotFound(`/${program}/${course}/notes/${slug}`)
  }
  return <NoteView data={data} title={noteTitle(data)} crumbs={noteCrumbs(data)} />
}
