/** A lecture's week and number read from its YouTube title. */
export type ParsedTitle = { week: number | null; lecture: string | null; title: string }

const PATTERNS: RegExp[] = [
  // "W1_L5A: Sets", "W1 L5", "Week 1 Lecture 5", "W01-L05"
  /^\s*w(?:eek)?\s*[_\-.]?\s*(\d{1,2})\s*[_\-.,:]?\s*l(?:ecture)?\s*[_\-.]?\s*(\d{1,3}[a-z]?)\b\s*/i,
  // "L1.1: Sets", "Lec 3.2 -"
  /^\s*l(?:ec(?:ture)?)?\s*[_\-]?\s*(\d{1,2})\.(\d{1,3}[a-z]?)\b\s*/i,
]

/**
 * "W1_L5A: Construction of subsets" → week 1, lecture "5A", title
 * "Construction of subsets". Titles without a week keep week and lecture null.
 */
export function parseLectureTitle(raw: string): ParsedTitle {
  const text = raw.replace(/\s+/g, ' ').trim()
  for (const pattern of PATTERNS) {
    const match = pattern.exec(text)
    if (match) {
      const rest = text
        .slice(match[0].length)
        .replace(/^[\s:|\-–—]+/, '')
        .trim()
      return {
        week: Number(match[1]),
        lecture: (match[2] ?? '').toUpperCase().replace(/^0+(?=\d)/, ''),
        title: rest || text,
      }
    }
  }
  return { week: null, lecture: null, title: text }
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

/** "5A" sorts after "5" and before "6". */
export function lectureSortKey(lecture: string | null): number {
  if (!lecture) return Number.MAX_SAFE_INTEGER
  const match = /^(\d+)([A-Z]?)$/.exec(lecture)
  if (!match) return Number.MAX_SAFE_INTEGER
  return Number(match[1]) * 100 + (match[2] ? match[2].charCodeAt(0) - 64 : 0)
}
