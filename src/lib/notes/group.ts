import type { ResourceItem } from '@/lib/data/types'

export type NoteGroup = {
  /** Anchor id, e.g. "week-3". */
  id: string
  heading: string
  items: ResourceItem[]
}

type GroupKey = { id: string; order: number; heading: (short: string) => string }

/**
 * Sorts a note into a section by its title: single weeks get their own
 * section ("MLT week 3 notes"), then multi-week notes, exam revision, formula
 * sheets, books and the rest. The headings carry the words students search
 * for, and each section is linkable (#week-3).
 */
function groupFor(title: string): GroupKey {
  const week = /^week\s+(\d+)$/i.exec(title.trim())
  if (week) {
    const n = Number(week[1])
    return { id: `week-${n}`, order: n, heading: (s) => `${s} week ${n} notes` }
  }
  if (/^weeks?\s+\d+\s*(?:to|-)\s*\d+/i.test(title)) {
    return { id: 'multi-week', order: 100, heading: (s) => `${s} full course and multi-week notes` }
  }
  if (/quiz|end\s*term|exam/i.test(title)) {
    return { id: 'exam-revision', order: 110, heading: (s) => `${s} quiz and exam revision notes` }
  }
  if (/formula|cheat/i.test(title)) {
    return { id: 'formula-sheets', order: 120, heading: (s) => `${s} formula sheets` }
  }
  if (/book/i.test(title)) {
    return { id: 'books', order: 130, heading: (s) => `${s} books` }
  }
  return { id: 'more-notes', order: 200, heading: (s) => `More ${s} notes` }
}

/** Groups a course's notes (already in popularity order) into sections. */
export function groupNotes(notes: ResourceItem[], shortName: string): NoteGroup[] {
  const groups = new Map<string, { key: GroupKey; items: ResourceItem[] }>()
  for (const note of notes) {
    const key = groupFor(note.title)
    const group = groups.get(key.id) ?? { key, items: [] }
    group.items.push(note)
    groups.set(key.id, group)
  }
  return [...groups.values()]
    .sort((a, b) => a.key.order - b.key.order)
    .map(({ key, items }) => ({ id: key.id, heading: key.heading(shortName), items }))
}
