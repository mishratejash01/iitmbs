import type { Metadata } from 'next'

import type { NotePageData } from '@/lib/data/notes'
import { getSeoOverrides } from '@/lib/data/seo-overrides'
import { getSiteSettings } from '@/lib/data/settings'
import { weekNotesPath } from '@/lib/routes'
import type { Crumb } from '@/lib/seo/jsonld'
import { buildMetadata } from '@/lib/seo/metadata'
import { courseVars, weekVars } from '@/lib/seo/vars'

const TEMPLATE = { week: 'week_notes', topic: 'note', formula_sheet: 'formula_sheet', exam_prep: 'exam_prep' } as const

/** The visible title (H1) for each kind of note page. */
export function noteTitle(data: NotePageData): string {
  const { note, core, week } = data
  const short = core.course.shortName
  switch (note.kind) {
    case 'week':
      return `IITM ${short} Week ${week?.number ?? ''} Notes: ${week?.title ?? note.title}`
    case 'formula_sheet':
      return `IITM ${short} Formula Sheet`
    case 'exam_prep':
      return `IITM ${short} Qualifier Exam Preparation`
    default:
      return note.title
  }
}

export function noteCrumbs(data: NotePageData): Crumb[] {
  const { note, core, week } = data
  const base: Crumb[] = [
    { name: core.course.program.shortName, path: core.course.program.path },
    { name: core.course.shortName, path: core.course.path },
  ]
  if (note.kind === 'week' && week) {
    return [...base, { name: `Week ${week.number}`, path: week.path }, { name: 'Notes', path: note.path }]
  }
  const label = note.kind === 'formula_sheet' ? 'Formula sheet' : note.kind === 'exam_prep' ? 'Exam prep' : note.title
  return [...base, { name: label, path: note.path }]
}

export async function noteMetadata(data: NotePageData | null): Promise<Metadata> {
  if (!data) return { robots: { index: false } }
  const [settings, overrides] = await Promise.all([getSiteSettings(), getSeoOverrides()])
  const { note, core, week } = data
  const vars = week ? { ...weekVars(core, week), note: note.title } : { ...courseVars(core), note: note.title }
  return buildMetadata({
    settings,
    path: note.path,
    template: TEMPLATE[note.kind],
    vars,
    fallbackTitle: noteTitle(data),
    fallbackDescription: note.summary ?? noteTitle(data),
    seo: note.seo,
    override: overrides[note.path],
    // An exam-prep page made only of practice sets still needs real content.
    noindex: note.kind === 'exam_prep' && !note.bodyMdx && data.practiceSets.length === 0,
    type: 'article',
    publishedTime: note.publishedAt,
    modifiedTime: note.updatedAt,
  })
}

/** Previous/next links between consecutive weeks' notes. */
export function weekNoteNeighbours(data: NotePageData) {
  const { core, week } = data
  if (!week) return { previous: null, next: null }
  const target = (n: number, label: string) => {
    const w = core.weeks.find((x) => x.number === n)
    const exists = core.notes.some((note) => note.kind === 'week' && note.weekNumber === n)
    return w && exists
      ? { href: weekNotesPath(core.course.program.slug, core.course.slug, n), label, title: `Week ${n}: ${w.title}` }
      : null
  }
  return { previous: target(week.number - 1, 'Previous week'), next: target(week.number + 1, 'Next week') }
}
