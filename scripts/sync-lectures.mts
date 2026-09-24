#!/usr/bin/env node
/**
 * Pulls the official lecture videos from the IIT Madras BS YouTube channels
 * through the YouTube Data API and stores them in lecture_videos. The site
 * embeds the videos with YouTube's player; nothing is downloaded.
 *
 *   npm run lectures:sync -- --list   list the channels' playlists (to map them)
 *   npm run lectures:sync             sync the courses in scripts/lecture-playlists.json
 *
 * lecture-playlists.json maps a course code to its playlists. The first
 * playlist is the course; later ones (a qualifier copy, a newer run) only add
 * videos the course does not have yet. `labelledOnly` keeps just the videos
 * whose title names a week, for playlists that mix in talks and events.
 *
 * Needs YOUTUBE_API_KEY (a YouTube Data API v3 key) plus the Supabase
 * variables used by the other scripts. Re-running is safe: videos are
 * matched by their YouTube id, and ones that left the playlists are removed.
 */
import { readFile } from 'node:fs/promises'

import { inheritWeeks, isLiveSession, parseLectureTitle } from '../src/lib/lectures/videos.ts'
import { runSql } from './supabase-sql.mjs'

const CHANNELS = [
  'UCvKzzGO37oT83K0FwnUucxw', // IIT Madras - B.S. Degree Programme
  'UCgilzuU7GzYtdqp-a2REing', // IIT Madras - BS in Electronic Systems
]
const API = 'https://www.googleapis.com/youtube/v3'

const key = process.env.YOUTUBE_API_KEY
if (!key) throw new Error('Set YOUTUBE_API_KEY (a YouTube Data API v3 key).')

type Page<T> = { items?: T[]; nextPageToken?: string }

async function api<T>(path: string, params: Record<string, string>): Promise<T[]> {
  const items: T[] = []
  let pageToken = ''
  do {
    const query = new URLSearchParams({ ...params, key: key!, maxResults: '50' })
    if (pageToken) query.set('pageToken', pageToken)
    const response = await fetch(`${API}/${path}?${query}`)
    if (!response.ok)
      throw new Error(`YouTube ${path} failed (${response.status}): ${await response.text()}`)
    const body = (await response.json()) as Page<T>
    items.push(...(body.items ?? []))
    pageToken = body.nextPageToken ?? ''
  } while (pageToken)
  return items
}

type Playlist = { id: string; snippet: { title: string }; contentDetails: { itemCount: number } }
type PlaylistItem = {
  snippet: { title: string; position: number; resourceId: { videoId: string } }
  contentDetails: { videoId: string; videoPublishedAt?: string }
}
type Video = {
  id: string
  contentDetails: { duration: string }
  status: { embeddable: boolean; privacyStatus: string }
}

/** "PT1H2M5S" → 3725. */
function seconds(duration: string): number | null {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(duration)
  if (!match) return null
  return Number(match[1] ?? 0) * 3600 + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0)
}

const sql = (value: string | number | null) =>
  value === null
    ? 'null'
    : typeof value === 'number'
      ? String(value)
      : `'${value.replace(/'/g, "''")}'`

if (process.argv.includes('--list')) {
  const playlists: Playlist[] = []
  for (const channelId of CHANNELS) {
    playlists.push(
      ...(await api<Playlist>('playlists', { part: 'snippet,contentDetails', channelId })),
    )
  }
  for (const p of playlists.sort((a, b) => a.snippet.title.localeCompare(b.snippet.title))) {
    console.log(`${p.id}\t${String(p.contentDetails.itemCount).padStart(4)}\t${p.snippet.title}`)
  }
  console.log(`\n${playlists.length} playlists`)
  process.exit(0)
}

type Course = { playlists: string[]; labelledOnly?: boolean }

const mapping = JSON.parse(
  await readFile(new URL('./lecture-playlists.json', import.meta.url), 'utf8'),
) as Record<string, Course>

type Row = {
  youtubeId: string
  playlistId: string
  title: string
  week: number | null
  lecture: string | null
  seconds: number | null
  uploadedAt: string | null
}

/** One playlist's playable lectures, in playlist order. */
async function playlistLectures(playlistId: string): Promise<Row[]> {
  const items = await api<PlaylistItem>('playlistItems', {
    part: 'snippet,contentDetails',
    playlistId,
  })
  items.sort((a, b) => a.snippet.position - b.snippet.position)
  const ids = items.map((item) => item.contentDetails.videoId)
  const videos = new Map<string, Video>()
  for (let i = 0; i < ids.length; i += 50) {
    const batch = await api<Video>('videos', {
      part: 'contentDetails,status',
      id: ids.slice(i, i + 50).join(','),
    })
    for (const video of batch) videos.set(video.id, video)
  }
  const parsed = inheritWeeks(
    items
      .filter((item) => !isLiveSession(item.snippet.title))
      .map((item) => ({ item, ...parseLectureTitle(item.snippet.title) })),
  )
  // Only videos that allow embedding can play on the site. Many lectures are
  // unlisted: the channel shares them through its public playlists instead of
  // search. Private and deleted videos are left out.
  return parsed.flatMap(({ item, week, lecture, title }) => {
    const video = videos.get(item.contentDetails.videoId)
    if (!video || !video.status.embeddable || video.status.privacyStatus === 'private') return []
    return [
      {
        youtubeId: video.id,
        playlistId,
        title: title.slice(0, 200),
        week,
        lecture,
        seconds: seconds(video.contentDetails.duration),
        uploadedAt: item.contentDetails.videoPublishedAt ?? null,
      },
    ]
  })
}

/** What makes two uploads the same lecture: its week and number, or else its title. */
const lectureKey = (row: Row) =>
  row.week !== null && row.lecture !== null
    ? `${row.week}/${row.lecture}`
    : `${row.week}/${row.title.toLowerCase().replace(/\s+/g, ' ')}`

/**
 * The same video uploaded twice: same title and length (give or take a few
 * seconds), and no clash in week or lecture number.
 */
const sameUpload = (a: Row, b: Row) =>
  a.title.toLowerCase() === b.title.toLowerCase() &&
  a.seconds !== null &&
  b.seconds !== null &&
  Math.abs(a.seconds - b.seconds) <= 3 &&
  (a.week === null || b.week === null || a.week === b.week) &&
  (a.lecture === null || b.lecture === null || a.lecture === b.lecture)

let total = 0
for (const [code, course] of Object.entries(mapping)) {
  const rows: Row[] = []
  const ids = new Set<string>()
  for (const [index, playlistId] of course.playlists.entries()) {
    const known = new Set(rows.map(lectureKey))
    for (const row of await playlistLectures(playlistId)) {
      if (ids.has(row.youtubeId)) continue
      if (index > 0 && known.has(lectureKey(row))) continue
      if (course.labelledOnly && row.week === null) continue
      ids.add(row.youtubeId)
      const twin = rows.findIndex((other) => sameUpload(other, row))
      // Keep one copy, preferring the one whose title names its week and number.
      const labels = (r: Row) => Number(r.week !== null) + Number(r.lecture !== null)
      if (twin === -1) rows.push(row)
      else if (labels(row) > labels(rows[twin]!)) rows[twin] = row
    }
  }
  if (rows.length === 0) {
    console.warn(`${code}\tno playable lectures, skipped`)
    continue
  }
  const values = rows.map((row, position) =>
    [
      sql(row.youtubeId),
      sql(row.playlistId),
      sql(row.title),
      sql(row.week),
      sql(row.lecture),
      sql(position),
      sql(row.seconds),
      sql(row.uploadedAt),
    ].join(', '),
  )
  // One statement, so a course is replaced all at once or not at all.
  const [result] = (await runSql(`
    with v (youtube_id, playlist_id, title, week, lecture, position, duration_seconds, uploaded_at) as (
      values ${values.map((v) => `(${v})`).join(',\n')}
    ),
    course as (select id from public.note_courses where code = ${sql(code)} and deleted_at is null),
    upserted as (
      insert into public.lecture_videos
        (note_course_id, youtube_id, playlist_id, title, week, lecture, position, duration_seconds, uploaded_at, is_published)
      select course.id, v.youtube_id, v.playlist_id, v.title, v.week::smallint, v.lecture, v.position,
             v.duration_seconds, v.uploaded_at::timestamptz, true
      from v cross join course
      on conflict (note_course_id, youtube_id) where deleted_at is null do update set
        playlist_id = excluded.playlist_id, title = excluded.title, week = excluded.week,
        lecture = excluded.lecture, position = excluded.position,
        duration_seconds = excluded.duration_seconds, uploaded_at = excluded.uploaded_at
      returning 1
    ),
    removed as (
      delete from public.lecture_videos lv
      using course
      where lv.note_course_id = course.id and lv.youtube_id not in (select youtube_id from v)
      returning 1
    )
    select (select count(*) from upserted)::int as synced, (select count(*) from removed)::int as removed
  `)) as Array<{ synced: number; removed: number }>
  const synced = result?.synced ?? 0
  if (synced === 0) {
    console.warn(`${code}\tno such course, skipped`)
    continue
  }
  total += synced
  const weeks = new Set(
    rows.flatMap((row) => (row.week !== null && row.week >= 1 ? [row.week] : [])),
  )
  console.log(`${code}\t${synced} lectures\t${weeks.size} weeks\t${result?.removed ?? 0} removed`)
}
await runSql('select private.refresh_search_index(true);')
console.log(`Synced ${total} lectures.`)
