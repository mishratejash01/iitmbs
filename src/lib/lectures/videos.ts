/** A lecture's week and number read from its YouTube title. */
export type ParsedTitle = { week: number | null; lecture: string | null; title: string }

// Lecture numbers: "5", "5A", "1.1", or "T1" for a tutorial.
const END = '(?![a-z0-9])'

const PATTERNS: Array<{
  pattern: RegExp
  week: number | null
  lecture: number | null
  tutorial?: boolean
}> = [
  // "W1_L5A: Sets", "W1_L1.1:", "W1.L1.", "W6L31_Subset sum", "Week 1 Lecture 5"
  {
    pattern: new RegExp(
      `^\\s*w(?:eek)?\\s*[_\\-.]?\\s*(\\d{1,2})\\s*[_\\-.,:]?\\s*l(?:ec(?:ture)?)?\\s*[_\\-.]?\\s*(\\d{1,3}(?:\\.\\d{1,2})?[a-z]?)${END}`,
      'i',
    ),
    week: 1,
    lecture: 2,
  },
  // "W1_T2: Tutorial 2", "Week 2 Tutorial 2.6"
  {
    pattern: new RegExp(
      `^\\s*w(?:eek)?\\s*[_\\-.]?\\s*(\\d{1,2})\\s*[_\\-.,:]?\\s*t(?:ut(?:orial)?)?\\s*[_\\-.]?\\s*(\\d{1,2}(?:\\.\\d{1,2})?)${END}`,
      'i',
    ),
    week: 1,
    lecture: 2,
    tutorial: true,
  },
  // "L1.1: Sets", "L 1.2 : Basics", "Lec 3.2 -"
  {
    pattern: new RegExp(
      `^\\s*l(?:ec(?:ture)?)?\\s*[_\\-]?\\s*(\\d{1,2})\\.(\\d{1,2}[a-z]?)${END}`,
      'i',
    ),
    week: 1,
    lecture: 2,
  },
  // "1.1 : Introduction", "4.2 Stochastic local search"
  { pattern: /^\s*(\d{1,2})\.(\d{1,2}[a-z]?)(?=\s|:|-)/i, week: 1, lecture: 2 },
  // "W0: Introduction", "W1_Tutorial: ...", "Week 02 - Additional lecture 01"
  { pattern: /^\s*w(?:eek)?\s*[_\-.]?\s*(\d{1,2})(?![0-9])(?=[\s_:\-–])/i, week: 1, lecture: null },
  // "L1: Introduction", "Lec 1 - Setup", "Lecture 1:datasets"
  {
    pattern: /^\s*l(?:ec(?:ture)?)?\s*[_\-.]?\s*(\d{1,3}[a-z]?)(?![a-z0-9.])/i,
    week: null,
    lecture: 1,
  },
  // "15. Hedge Algorithm", "17: Coding for Synthesis"
  { pattern: /^\s*(\d{1,3})\s*[.:)](?=\s)/, week: null, lecture: 1 },
]

/**
 * "W1_L5A: Construction of subsets" → week 1, lecture "5A", title
 * "Construction of subsets". Tutorials become "T1"; titles without a week
 * keep week null (and lecture null when there is no number either).
 */
export function parseLectureTitle(raw: string): ParsedTitle {
  const text = raw.replace(/\s+/g, ' ').trim()
  for (const { pattern, week, lecture, tutorial } of PATTERNS) {
    const match = pattern.exec(text)
    if (!match) continue
    const rest = text
      .slice(match[0].length)
      .replace(/^[\s:|\-–—._]+/, '')
      .trim()
    const number =
      lecture === null ? null : (match[lecture] ?? '').toUpperCase().replace(/^0+(?=\d)/, '')
    const parsed = number === null ? null : tutorial ? `T${number}` : number
    return {
      week: week === null ? null : Number(match[week]),
      lecture: parsed,
      // A title that is only its label ("Week 02 - Tutorial 06") reads as the label.
      title: rest || lectureLabel(parsed) || text,
    }
  }
  return { week: null, lecture: null, title: text }
}

/** Live-session recordings share some lecture playlists; they are not lectures. */
export function isLiveSession(title: string): boolean {
  return /^\s*live(?![a-z])|live[\s_-]*session/i.test(title)
}

/** "Lecture 5A", "Tutorial 2", or null for videos without a number. */
export function lectureLabel(lecture: string | null): string | null {
  if (!lecture) return null
  return lecture.startsWith('T') ? `Tutorial ${lecture.slice(1)}` : `Lecture ${lecture}`
}

/** 754 → "12:34"; 3725 → "1:02:05". */
export function formatDuration(seconds: number | null): string | null {
  if (seconds === null || seconds <= 0) return null
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}

/** 754 → "PT12M34S", for VideoObject markup. */
export function isoDurationFromSeconds(seconds: number | null): string | undefined {
  if (seconds === null || seconds <= 0) return undefined
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `PT${h ? `${h}H` : ''}${m ? `${m}M` : ''}${s || (!h && !m) ? `${s}S` : ''}`
}

/**
 * Playlists keep a lecture's extra parts (a tutorial, a second take) next to
 * it, often without a week in the title. A video with no week takes the week
 * of the labelled videos around it when both sides agree; otherwise it keeps
 * none. `videos` must be in playlist order.
 */
export function inheritWeeks<T extends { week: number | null }>(videos: T[]): T[] {
  const before: Array<number | null> = []
  let last: number | null = null
  for (const video of videos) {
    before.push(last)
    if (video.week !== null) last = video.week
  }
  const after: Array<number | null> = []
  let next: number | null = null
  for (let i = videos.length - 1; i >= 0; i -= 1) {
    after[i] = next
    if (videos[i]!.week !== null) next = videos[i]!.week
  }
  return videos.map((video, i) =>
    video.week === null && before[i] !== null && before[i] === after[i]
      ? { ...video, week: before[i]! }
      : video,
  )
}

type Orderable = {
  week: number | null
  lecture: string | null
  position: number
  sort_order?: number
}

/**
 * Teaching order: by week (week 0 first, videos without a week last); inside
 * a week by lecture number when most of its videos have one, otherwise in
 * playlist order.
 */
export function orderLectures<T extends Orderable>(videos: T[]): T[] {
  const weeks = new Map<number, T[]>()
  for (const video of videos) {
    const key = video.week ?? Number.MAX_SAFE_INTEGER
    weeks.set(key, [...(weeks.get(key) ?? []), video])
  }
  const byPlaylist = (a: T, b: T) =>
    (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.position - b.position
  return [...weeks.entries()]
    .sort(([a], [b]) => a - b)
    .flatMap(([, group]) => {
      const numbered = group.filter((video) => video.lecture !== null).length
      return numbered * 2 > group.length
        ? [...group].sort(
            (a, b) => lectureSortKey(a.lecture) - lectureSortKey(b.lecture) || byPlaylist(a, b),
          )
        : [...group].sort(byPlaylist)
    })
}

/** Teaching order: 1 < 1.1 < 1.2 < 2 < 5 < 5A < 5B < 10, then tutorials, then unnumbered videos. */
export function lectureSortKey(lecture: string | null): number {
  if (!lecture) return Number.MAX_SAFE_INTEGER
  const match = /^(T?)(\d+)(?:\.(\d+))?([A-Z]?)$/.exec(lecture)
  if (!match) return Number.MAX_SAFE_INTEGER - 1
  const [, tutorial, major, minor, letter] = match
  return (
    (tutorial ? 1_000_000 : 0) +
    Number(major) * 10_000 +
    Number(minor ?? 0) * 100 +
    (letter ? letter.charCodeAt(0) - 64 : 0)
  )
}
